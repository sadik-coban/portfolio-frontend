# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/sadik-coban/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Sadik Coban
**Direction:** Bento grid, light (2nd iteration; replaces the Swiss-minimal first pass)
**Scope:** the site frame (PaperShell: nav + footer), the homepage and /projects.
Its palette is the project, report and dashboard pages' own warm paper and green, so the whole
site speaks one colour language.

### How this was assembled

`search.py --design-system` did not return a bento system for this product. For
"portfolio bento grid" it offered an off-topic "Vibrant & Block-based" style with Russo One. So
the system is composed from verified domain searches instead:

| Part | Query | Result used |
|------|-------|-------------|
| Style | `"bento grid cards modern" --domain style` | **Bento Box Grid** — modular cards, asymmetric grid, varied spans, `rounded-xl`+, subtle shadows |
| Type | `"tech product developer modern sans" --domain typography` | **Tech Startup** — Space Grotesk / DM Sans |
| Palette | Bento Box Grid row: "Neutral base + brand accent" | the site's existing warm paper + one green, below |

---

## Global Rules

### Color Palette

Tokens live in `app/globals.css` as `--site-*` and are exposed to Tailwind as `bg-site-bg`,
`text-site-ink`, `border-site-line` and so on. Components never use raw hex.

| Role | Token | Hex |
|------|-------|-----|
| Page background | `--site-bg` | `#F7F6F3` |
| Tile / card | `--site-card` | `#FDFCF9` |
| Ink (headings, values) | `--site-ink` | `#1A1A1A` |
| Ink 2 (body) | `--site-ink-2` | `#45443F` |
| Muted (labels, captions) | `--site-muted` | `#5F5F5A` |
| Line (tile borders, rules) | `--site-line` | `#E9E7E2` |
| Accent (links, the highlighted data series, focus ring) | `--site-accent` | `#047857` |
| Primary (CTA fill) | `--site-primary` | `#1A1A1A` |
| Live (the "live demo" badge dot only, always beside its label) | `--site-live` | `#059669` |

These token names are kept separate from the shadcn tokens (`--background`, `--accent`…)
because the project pages' components read those.

Measured contrast: ink/card 17.0 · ink-2/card 9.5 · muted/card 6.3 · muted/bg 5.9 ·
accent/card 5.35 · accent/bg 5.07 · white/primary 17.4 · live dot/card 3.67 (non-text).

Why green, not the first pass's blue (#2563EB): every page a tile leads to (overview, reports,
dashboard, drift, SHAP) is drawn in this paper + green, so a blue frame read as a second brand
the moment you clicked through. And #2563EB is the most generic default there is. The old meta
grey #86857e is deliberately not a token: at 3.6:1 it fails small text.

### Typography

- **Display:** Space Grotesk (`font-display`): headings, tile titles, status value
- **Text:** DM Sans (`font-text`): body, labels, chips
- **Numbers:** Geist Mono (`font-mono`, `tabular-nums`): metrics and figure values only
- Loaded with `next/font/google` in `app/_site/design/fonts.ts`, subsets `latin` + `latin-ext`
  (Turkish ğ ş ı İ), and imported only by PaperShell, so project pages never fetch them.

### Shape and spacing

- Tiles: `rounded-2xl`, `border border-site-line`, `bg-site-card`, padding 24–40px
- Grid: 12 columns from `lg`, 2 from `md`, 1 below; 16px gap (`gap-4`)
- Chips: `rounded-full bg-site-bg`, 13px

---

## Component Rules

### Project tile (`app/_site/home/ProjectTile.tsx`)

Contents, top to bottom:

1. badge row (kind, plus "coming soon" when unlinked)
2. domain label
3. title
4. summary (homepage) or full description (/projects)
5. mini figure
6. metric (homepage) or the three-metric stack (/projects)
7. surface links

- **Linked tile:** the title link's `::after` covers the tile. Surface links and inline links
  sit above it on `z-10`. Keyboard focus rings the whole tile via
  `has-[.tile-link:focus-visible]`.
- **Unlinked tile:** no overlay, no hover lift, a dashed "coming soon" badge. Never link to a
  page that isn't published.
- **Study with no final numbers:** a dashed "results coming soon" panel. **No placeholder
  chart**, because it would read as a result.

### Mini figures (`app/_site/home/MiniFigure.tsx`, data in `figures.ts`)

- Every number is copied from the project's own report, with the file and section named in a
  comment. Nothing is illustrative unless the tile says so (the MFF schematic does).
- HTML/CSS bars and strips, not SVG text, so labels stay at a fixed legible size.
- One `role="img"` per figure with a complete `aria-label`. The drawn parts are
  `aria-hidden`.
- Accent marks the one series the text is about. Comparison series are neutral.

### Hover and motion

- Linked tiles: border darkens and a soft shadow appears (200ms). **No scale transforms.**
- Colour transitions 150–250ms; `prefers-reduced-motion` collapses them (global rule).
- The only looping animation is the "live demo" badge dot (`pulseDot`), under `motion-safe`.

### Intro

- One full-width identity tile: eyebrow, headline, sub, CTA and GitHub/LinkedIn text links.
  No status/role/location side tiles. They were removed as visual noise, and the footer
  carries every contact link.

---

## Anti-Patterns (Do NOT Use)

- ❌ Raw hex in components: use `site-*` tokens
- ❌ Placeholder or invented chart data; a figure must trace to a report
- ❌ Scale-on-hover or other layout-shifting hovers
- ❌ Emojis as icons: use Lucide
- ❌ Low-contrast text (< 4.5:1)
- ❌ Invisible focus states
- ❌ A full-width manifesto headline: the intro is a tile, not a cover

---

## Pre-Delivery Checklist

- [ ] No raw hex in frame/home/projects components
- [ ] Every figure value matches its source report
- [ ] Unlinked tiles contain no `<a>` except inline credits, and show "coming soon"
- [ ] Focus visible on every link, and the tile ring for tile links
- [ ] `prefers-reduced-motion` respected
- [ ] 375 / 768 / 1440: no horizontal scroll
- [ ] `/tr`: Turkish letters render in Space Grotesk / DM Sans; uppercase labels show "İ"
