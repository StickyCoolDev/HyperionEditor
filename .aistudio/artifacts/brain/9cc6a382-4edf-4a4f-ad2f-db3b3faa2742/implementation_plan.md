# Documentation & Community Forum Implementation Plan (Pines UI Theming Revision)

Full production build of the Hyperion Editor Documentation and Forum multi-page applications (MPA), featuring compile-time modular Markdown compilation, the official **DevDojo Pines UI** neutral theme (monochrome black/white/neutral palette), an unchangeable white mode, and complete removal of legacy theme toggles and "Back to Editor" buttons.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core design and architectural decisions have been revised based on your feedback:

- **Confirmed Decision 1 (Authentic Pines UI Monochrome Palette)**: All custom color accents (blue, purple, or saturated tints) have been completely removed. The UI exclusively follows the official Pines UI neutral theming:
  - Primary interactive surfaces and actions: `bg-neutral-950 text-white hover:bg-neutral-900`
  - Secondary elements & subtle hover states: `bg-white border-neutral-200/70 hover:bg-neutral-100 text-neutral-700`
  - Focus rings: `focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900` or `focus:ring-neutral-200/60`
  - Text hierarchy: `text-neutral-900` (headings), `text-neutral-600` (body), and `text-neutral-400` / `text-neutral-500` (unboxed metadata)
  - Code blocks & inline badges: crisp neutral surfaces (`bg-neutral-900 text-neutral-100` for code snippets, `bg-neutral-100 text-neutral-800` for keyboard keys / badges)
- **Confirmed Decision 2 (Modular Markdown Parsed at Compile Time)**: Modular Markdown files stored within `docs/content/` compiled into clean HTML at build time via a dedicated Vite compiler plugin with zero client-side markdown parsing runtime overhead.
- **Confirmed Decision 3 (Pines UI Component Architecture)**: Official copy-and-paste DevDojo Pines UI patterns powered by Tailwind CSS and Alpine.js, featuring collapsible sidebar navigation, multi-level accordions, an interactive `Ctrl+K` search filter modal, copyable code blocks with instant state feedback, and breadcrumbs.
- **Confirmed Decision 4 (Immutable White Mode)**: Pure white canvas (`bg-white`), neutral-50/100 panels, and neutral-200 borders. All legacy dark mode CSS variables, theme toggle scripts, and localStorage theme sync are deleted.
- **Confirmed Decision 5 (Navigation Decoupling)**: "Back to Editor" buttons and color palette toggles are permanently removed from both pages.

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades the placeholder `/docs/` and `/forum/` routes into production-grade portals. Documentation content is authored in structured, modular Markdown files that Vite parses into static HTML at build time. The Forum provides a clean, neutral discussion hub with category filtering and a Pines UI discussion modal.
- **Target Audience / Persona**: Video creators and engineers seeking in-depth technical documentation on Hyperion's Canvas timeline, Web Audio engine, VFX shaders, and FFmpeg WebAssembly export pipeline, alongside community discussions.
- **Key Value**: Instantaneous first contentful paint (FCP), zero external client parsing latency, authentic DevDojo Pines UI styling, and clean neutral layout.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Documentation Browsing**:
   - The user opens `/docs/` and navigates via the sticky Pines UI collapsible sidebar or top breadcrumb trail (`Hyperion / Docs / Timeline & Canvas Engine`).
   - Content flows with clean headings, explanatory paragraphs, comparison tables, and code snippets with an instant copy button (`copied: false` -> `copied: true`).
   - Accordions allow expanding and collapsing advanced troubleshooting topics and hardware compatibility matrices.
2. **Instant Search (`Ctrl+K`)**:
   - Pressing <kbd>Ctrl</kbd> + <kbd>K</kbd> or clicking the search trigger opens a Pines UI search modal. As the user types, results dynamically filter across all documentation sections with keyboard navigation support.
3. **Static Community Forum**:
   - The user opens `/forum/` and filters discussions by channel (All, Help & Troubleshooting, Feature Ideas, Showcase & Templates).
   - Discussion items are rendered with unboxed text metadata (`Help · Posted 2h ago · 14 replies`) in line with anti-slop guidelines.
   - Clicking "New Discussion" triggers a sleek Pines UI modal dialog with discussion inputs and clean neutral buttons.

#### Visual Identity & Theme (Official DevDojo Pines Theming)
- **Canvas & Backgrounds**: Crisp pure white (`#ffffff` / `bg-white`) with subtle structural panels in neutral-50 (`#fafafa` / `bg-neutral-50`).
- **Borders & Dividers**: Hairline neutral borders (`border-neutral-200/70` and `border-neutral-200`).
- **Typography**: Satoshi Variable paired with monospace (`font-mono`) for code, shortcuts, and tabular numbers.
- **Action Elements & Buttons**:
  - Primary button: `inline-flex items-center justify-center px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 rounded-md bg-neutral-950 hover:bg-neutral-900 focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 focus:outline-none`
  - Secondary button: `inline-flex items-center justify-center px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 bg-white border rounded-md text-neutral-600 hover:text-neutral-900 border-neutral-200/70 hover:bg-neutral-100 active:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-200/60`
  - Active navigation pill: `bg-neutral-100 text-neutral-900 font-semibold`
  - Inactive navigation link: `text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50`

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Neutral DevDojo Palette vs. Custom Accent**:
  - *Chosen Approach*: Replace all custom colored accent classes (blue/indigo) with Pines UI neutral tokens (`neutral-950`, `white`, `neutral-100`, `neutral-200`).
  - *Why*: Matches DevDojo's official component design language exactly, providing an understated, sleek, and distraction-free developer experience.
- **Decision 2: Compile-Time Markdown Parsing via Vite Plugin**:
  - *Chosen Approach*: Implement a custom Vite build plugin that compiles `/docs/content/*.md` into styled HTML at build time and embeds the navigation structure directly into the document.
  - *Why*: Eliminates client-side parser weight, guarantees instant rendering without layout shifts, and keeps documentation files modular and versionable.
- **Decision 3: Alpine.js via CDN for Pines UI Reusability**:
  - *Chosen Approach*: Include Alpine.js directly in the docs and forum HTML entry points to drive Pines UI reactive directives (`x-data`, `x-show`, `x-transition`, `@click`).
  - *Why*: True to the DevDojo Pines philosophy of copy-and-paste reactivity without requiring React/Vue scaffolding for static pages.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vite MPA Build System                           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴────────────────────────┐
          ▼                                                  ▼
┌───────────────────────────────┐                  ┌─────────────────────┐
│  Compile-Time Docs Plugin     │                  │   Forum Static MPA  │
│  - Reads /docs/content/*.md   │                  │   - Pines UI Feed   │
│  - Parses markdown to HTML    │                  │   - Category Filter │
│  - Generates Table of Contents│                  │   - New Post Modal  │
└───────────────────────────────┘                  └─────────────────────┘
          │                                                  │
          ▼                                                  ▼
┌───────────────────────────────┐                  ┌─────────────────────┐
│    /docs/index.html           │                  │   /forum/index.html │
│  - Pines UI Sidebar           │                  │  - Static Threads   │
│  - Pines Search Modal         │                  │  - Alpine.js State  │
│  - Pines Accordion Sections   │                  │  - Neutral Theme    │
│  - Copyable Code Blocks       │                  │    (No Accents)     │
└───────────────────────────────┘                  └─────────────────────┘
```

#### Content Files (`/docs/content/`):
- `01-getting-started.md`: Requirements, SharedArrayBuffer, media import, interface overview.
- `02-timeline-engine.md`: Coordinate system, tracks (V1/V2/A1/A2), split (<kbd>S</kbd>), trimming, snapping.
- `03-vfx-engine.md`: Shaders (Blur, Grayscale, Invert, Sepia, Saturation, Contrast), keyframes.
- `04-audio-mixing.md`: Web Audio API gain nodes, sample rates (44.1kHz vs 48kHz), bitrate presets.
- `05-export-pipeline.md`: FFmpeg WebAssembly encoding, FastStart moov atom, resolution profiles.
- `06-troubleshooting.md`: Wasm memory limits, COOP/COEP cross-origin headers, GPU acceleration.
- `07-shortcuts.md`: Complete keyboard shortcut mapping.
