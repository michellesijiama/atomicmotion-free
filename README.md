# AtomicMotion — Free Components

A design library of expressive interfaces and interactions for designers and frontend developers.

**[Explore the design library](https://atomicmotion.dev)** — every live demo is free.

All 17 gallery components are free and open source. Copy the source and required assets directly from this repository.

## Free components

| Component | Category | Source | Demo |
| --- | --- | --- | --- |
| Emoji Sketch | Tool | [Source](components/tool/emoji-sketch/emoji-sketch.tsx) | [Preview](https://atomicmotion.dev/components/emoji-sketch) |
| Soft Menu Reveal | Navigation | [Source](components/navigation/soft-menu-reveal/soft-menu-reveal.tsx) | [Preview](https://atomicmotion.dev/components/soft-menu-reveal) |
| Filter Dropdown Reveal | Navigation | [Source](components/navigation/filter-dropdown-reveal/filter-dropdown-reveal.tsx) | [Preview](https://atomicmotion.dev/components/filter-dropdown-reveal) |
| Scroll-Scrubbed Typography | Typography | [Source](components/typography/scroll-scrubbed-typography/scroll-scrubbed-typography.tsx) | [Preview](https://atomicmotion.dev/components/scroll-scrubbed-typography) |
| Codex Sidebar Reveal | Navigation | [Source](components/navigation/codex-sidebar-reveal/codex-sidebar-reveal.tsx) | [Preview](https://atomicmotion.dev/components/codex-sidebar-reveal) |
| Gemini Live | AI | [Source](components/ai/gemini-live/gemini-live.tsx) | [Preview](https://atomicmotion.dev/components/gemini-live) |
| Geometric Logo Reveal | Typography | [Source](components/typography/geometric-logo-reveal/geometric-logo-reveal.tsx) | [Preview](https://atomicmotion.dev/components/geometric-logo-reveal) |
| Gradient Gummy Bear | 3D | [Source](components/3d/gradient-gummy-bear/gradient-gummy-bear.tsx) | [Preview](https://atomicmotion.dev/components/gradient-gummy-bear) |
| Scroll Phase Cursor | Cursor | [Source](components/cursor/scroll-phase-cursor/scroll-phase-cursor.tsx) | [Preview](https://atomicmotion.dev/components/scroll-phase-cursor) |
| Voice Bloom | AI | [Source](components/ai/voice-bloom/voice-bloom.tsx) | [Preview](https://atomicmotion.dev/components/voice-bloom) |
| Showreel Sphere | 3D | [Source](components/3d/showreel-sphere/showreel-sphere.tsx) | [Preview](https://atomicmotion.dev/components/showreel-sphere) |
| Coffee Gauge | Data Visualization | [Source](components/data-visualization/coffee-gauge/coffee-gauge.tsx) | [Preview](https://atomicmotion.dev/components/coffee-gauge) |
| Halftone Bloom | Data Visualization | [Source](components/data-visualization/halftone-bloom/halftone-bloom.tsx) | [Preview](https://atomicmotion.dev/components/halftone-bloom) |
| Blossom Light | Control | [Source](components/control/blossom-light/blossom-light.tsx) | [Preview](https://atomicmotion.dev/components/blossom-light) |
| Gradient Event Card | Gradient | [Source](components/gradient/gradient-event-card/gradient-event-card.tsx) | [Preview](https://atomicmotion.dev/components/gradient-event-card) |
| Stamp Tracker | Data Visualization | [Source](components/data-visualization/stamp-tracker/stamp-tracker.tsx) | [Preview](https://atomicmotion.dev/components/stamp-tracker) |
| Doodle Calendar | Data Visualization | [Source](components/data-visualization/doodle-calendar/doodle-calendar.tsx) | [Preview](https://atomicmotion.dev/components/doodle-calendar) |

## Using a free component

1. Open its folder and follow its README for dependencies and required assets.
2. Copy the TSX component into a React + TypeScript project with Tailwind CSS v4.
3. Copy its required runtime assets and retain the listed attribution.
4. Import and render its exported component.

See the [integration guide](docs/COPY-PASTE.md) for Tailwind setup and common issues.

This is a copy-paste library; it does not include the gallery app or an npm package.

## Verify the library

Use Node.js 24. The included dependency lock reproduces the versions tested by the design library:

```bash
nvm use
npm ci
npm run check
```

Checks verify the free-only publication, compile each component and its README example without Next.js, and audit dependencies. GitHub runs these checks on pushes and pull requests.
The root package is a verification environment, not a published npm package. Install only the packages listed in your chosen component's README in your own app.
Dependency updates are prepared and verified in the complete application repository, then exported here with an updated manifest and lockfile.

## License

The included source is [MIT-licensed](LICENSE). Runtime assets retain the terms in [ASSETS.md](ASSETS.md).

Designed and built by [Sijia Ma](https://www.linkedin.com/in/michellesijiama/).
