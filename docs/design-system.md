# Design System — portfolio

The design language for the portfolio (homepage, blog, projects, about, and the Car Price
MLOps app). Two coherent layers sharing one green accent, on a single warm paper ground:

- **Editorial layer** (homepage, blog, projects, about) — warm **paper** ground, near-black
  ink, monospace reserved for numbers and technical labels. Calm, print-like, figure-forward.
  Wrapped by [`PaperShell`](../app/_site/PaperShell.tsx).
- **App layer** (Car Price: dashboard, EDA, report, predict, drift, SHAP…) — the same green
  accent, a collapsible sidebar shell, chart-dense. Wrapped by [`FinalShell`](../app/_site/FinalShell.tsx).

**Light only.** Dark mode is deactivated (see §8).

---

## 1. Principles

- **Editorial calm, technical detail** — generous whitespace, hairline dividers, one accent.
  No terminal/`code`-style chrome in product UI.
- **Mono is for numbers** — Geist Mono only on figures, metrics, axis ticks, eyebrows, stack
  lists. Prose is sans.
- **Two shades of one green** — `#047857` for UI (text, numbers, links, in-UI dots);
  `#059669` for graphics (chart lines, fills, sparklines). Intentional, not a mismatch.
- **Bilingual-ready, English-only for now** — all copy flows through the i18n dictionary
  (TR/EN); Turkish is deactivated behind the `I18N_ENABLED` flag, so only EN renders (see §7).

---

## 2. Colour tokens

Light-only, so a single column. `dark:` classes may linger in code but never activate.

### Editorial layer (marketing) — warm paper
| Token | Value | Use |
|---|---|---|
| **paper** (page bg) | `#f7f6f3` | page ground, every route |
| **surface** (card) | `#fdfcf9` | hero figure, cards, sidebar |
| **panel** (inset) | `#f3f1ec` | thumbnail wells |
| **hairline** (border) | `#e9e7e2` | dividers / card borders |
| **ink** (text) | `#1a1a1a` | primary text, headings |
| **body** | `#33332f` | long-form body |
| **secondary** | `#5f5f5a` | nav / secondary text |
| **muted** | `#86857e` | labels / eyebrows |
| **stack** | `#565650` | mono stack lists |
| **accent** (UI) | `#047857` | text, numbers, links, eyebrows on page headers |
| **accent-graphics** | `#059669` | chart lines/fills, sparkline, choropleth |

### App layer (dashboard/EDA) — `makeHybridTheme()` in [`../app/_charts/types.ts`](../app/_charts/types.ts)
Light-only, **no argument** (the old `isDark` param was removed). Tokens: accent `#059669`,
grid `#ece9e3`, axis `#dcd9d2`, text `#1a1a1a`, muted `#9a9a92`, surface `#fdfcf9`.

**Chart palette:** `['#059669','#0d9aba','#7c5cff','#e08a1e','#ef4444','#0891b2']`.

**Semantic:** positive/live = emerald, danger/damage = `#ef4444`. Never hard-code chart colours —
always pull from the theme.

---

## 3. Typography

Fonts wired in [`../app/layout.tsx`](../app/layout.tsx) via `next/font`:

- **Sans** — Inter → `--font-geist-sans` → `font-sans`. Prose, headings, body.
- **Mono** — Geist Mono → `--font-geist-mono` → `font-mono`. **Numbers, metrics, eyebrows,
  axis ticks, stack lists only.**

| Role | Spec |
|---|---|
| Hero H1 | `text-[40px] md:text-[56px] font-bold tracking-[-0.04em] leading-[1.05]` |
| Section eyebrow / kicker | `font-mono text-[12–13px] uppercase tracking-[0.14–0.16em]` — `#047857` on page headers, `#86857e` on section labels |
| Metric number | `font-mono text-[22px] md:text-[28px] tracking-[-0.035em] tabular-nums` |
| Project title | `text-[21px] md:text-[23px] font-semibold tracking-[-0.026em]` |
| Body | `text-[15–18px] leading-[1.6]` (`secondary`) |

---

## 4. Layout & spacing

- **Content width** — marketing (`PaperShell`) `max-w-[1192px]`; app main (`FinalShell`) `max-w-[1180px]`.
- **Gutter** — marketing `px-6`; app main `px-5 md:px-12`.
- **Section rhythm** — homepage sections `py-14`; list rows `py-7` on a `border-t` hairline.
- **Radius** — cards / buttons / inputs `rounded-[10px]`; chart panels `14px`; sidebar nav rows
  `rounded-[8px]`; status pills `rounded-full`.
- **Borders** — always 1px, token colour. No drop shadows beyond a faint card/hero glow.
- **Focus & motion a11y** — global `:focus-visible` ring (`2px #047857`) and a
  `prefers-reduced-motion` reset in [`../app/globals.css`](../app/globals.css).

---

## 5. Components

| Component | File | Notes |
|---|---|---|
| **PaperShell** | [`PaperShell.tsx`](../app/_site/PaperShell.tsx) | Marketing wrapper: paper ground, top nav (`Monogram` + links + `LangSwitch`), footer. Replaces the old `SiteFrame`. |
| **FinalShell** | [`FinalShell.tsx`](../app/_site/FinalShell.tsx) | Car-price app shell: collapsible desktop sidebar, mobile drawer, `kicker → H1 → meta` header. |
| **SidebarCollapse** | [`SidebarCollapse.tsx`](../app/_site/SidebarCollapse.tsx) | Provider for the desktop sidebar collapse state; cookie-persisted, server-read so the first paint is correct. Behind the `SIDEBAR_COLLAPSE_ENABLED` flag. |
| **Monogram** | [`Monogram.tsx`](../app/_site/Monogram.tsx) | The **`sc.`** wordmark — lowercase ink `sc` + a green `.`. Used in the `PaperShell` nav and the `FinalShell` sidebar. |
| **ChartPanel** | [`../app/_charts/ChartPanel.tsx`](../app/_charts/ChartPanel.tsx) | Titled, bordered chart container (14px radius), theme-aware. |
| **PlotlyChart** | [`PlotlyChart.tsx`](../components/charts/PlotlyChart.tsx) | Lazy Plotly wrapper; IntersectionObserver mount, debounced `ResizeObserver` re-fit, mobile tap-to-activate guard. |

### Buttons — one shape, colour by zone
Unified shape everywhere: `inline-flex h-[44px] items-center rounded-[10px] px-5 text-[14px] font-semibold`.

- **Brand CTA** (marketing) — `bg-[#1a1a1a] text-[#f7f6f3] hover:opacity-90`.
- **Product CTA** (app) — `bg-[#047857] text-white hover:bg-[#065f46]`.
- **Secondary** — `border border-[#d8d6d0] bg-[#fdfcf9] text-[#5f5f5a] hover:border-[#86857e]`.
- **Text link** — `text-[14px] font-medium text-[#1a1a1a] hover:text-[#047857]`.

### Cards
Whole card is one `<Link>` (blog / journal / project cards alike): `group block border-t
border-[#e9e7e2] py-7`, title hovers to `#047857`. Thumbnail wells: `rounded-[10px] border
border-[#e9e7e2] bg-[#f3f1ec]`.

### Stats — editorial strip
Metrics render as an editorial **strip** (mono value on top, muted label under, hairline
dividers), not boxed KPI cards — the same language on the homepage, overview, and dashboard KPIs.

### Status badge
`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full text-[#047857] bg-emerald-500/10`.

---

## 6. Charts

- **ECharts** ([`echarts-for-react`](../app/_charts/EChartsEdaPlots.tsx)) — primary figure library:
  dashboard, EDA, and the marketing hero/thumbnail area figures.
- **Plotly** — the interactive analysis report; loads the cartesian partial bundle and
  lazy-mounts each chart via IntersectionObserver (see `PlotlyChart`).
- **Recharts** — drift KDE area charts.
- All chart styling comes from `makeHybridTheme()` — never hard-code chart colours.
- Heatmaps: emerald `visualMap` for density; red-intensity for the damage grid; diverging
  red↔emerald for correlation.

*(Chart.js was removed — no `ChartjsChart` any more.)*

---

## 7. Internationalisation

- Provider [`i18n.tsx`](../app/_site/i18n.tsx) → `useLang()` returns `{ lang, setLang, t }`.
  `t('key', { var })` interpolates `{var}`.
- Flat `en` / `tr` dictionary, keyed by namespace: `home.*`, `blog.*`, `projects.*`, `about.*`,
  `eda.*`, `dash.*`, `pr.*`, `dr.*`, `shap.*`, `rep.*`, `jr.*`, …
- **Turkish is currently deactivated** behind `I18N_ENABLED`; the site renders English-only.
  The TR strings stay in the dictionary so it can be switched back on.
- Rule: **no user-facing string is hard-coded** — add a key to both `en` and `tr`.

---

## 8. Theme

- **Light only.** [`../components/providers.tsx`](../components/providers.tsx) wraps the app in
  next-themes with `forcedTheme="light" defaultTheme="light" enableSystem={false}`.
- next-themes stays a dependency (it drives the forced light class); no `ThemeToggle` is rendered.
- `dark:` variant classes may remain in older code but never activate; new components are
  written light-only.
- The warm paper ground (`#f7f6f3`) is the single background across **every** page — marketing
  (`PaperShell`) and app (`FinalShell`) alike.

---

## 9. Motion

- CSS only — no `framer-motion` (it was removed).
- Subtle: hover `-translate-y` / arrow `translate-x`, the emerald pulse on the "available" dot,
  and the sidebar `transition-[width] duration-200` collapse.
- `prefers-reduced-motion` is honoured globally (see §4).

---

## 10. Do / Don't

**Do** — `#047857` for UI, `#059669` for graphics · 1px token borders · `tabular-nums` for
figures · route every string through i18n · give charts theme tokens · one button shape (`rounded-[10px]`, `h-[44px]`).

**Don't** — terminal/`#fn()` styling in product UI · hard-coded hex in components · heavy drop
shadows · mixing blue/purple accents from the legacy site · boxed KPI cards (use the editorial strip).
