# Site Audit — post-migration status

_Prepared 2026-06-28 (before promoting the redesign to root). **Updated 2026-07-01** — the
migration is done, so this now tracks the live root site and what's left before/around launch._

There is now **one tree**: the warm "paper-editorial" redesign lives at the root
(`app/[lang]/**` routes + `app/_site/**` components). The old cool slate/blue production site,
the `app/preview/**` sandboxes, and their dead components are gone. The site is **English-only**
(Turkish is built but deactivated behind `I18N_ENABLED`).

**Legend:** **[done]** resolved · **[open]** still needs work · **[watch]** ongoing/verify.

---

## 1. SEO & metadata

| # | Where | Status | Notes |
|---|-------|--------|-------|
| 1.1 | all pages | **[done]** | Real per-page titles now come from `site.pages` in [`site-config.ts`](../app/_site/site-config.ts); the `%s \| Sadık Çoban` template applies via `app/layout.tsx`. |
| 1.2 | all pages | **[done]** | Each route has a unique `description` in `site.pages`. |
| 1.3 | site-wide | **[open]** | **No OG image.** `site.openGraph.image` and `twitter.image` are empty, so the Twitter card falls back to `summary` (no rich preview). Add `/public/og.png` (or an `opengraph-image` route) and set both in `site-config.ts`. |
| 1.4 | [`app/sitemap.ts`](../app/sitemap.ts) | **[done]** | Rebuilt — derives from `site.pages` + `BLOG_POSTS`; emits `tr` alternates only when `I18N_ENABLED`. Verify every entry resolves 200 at launch. |
| 1.5 | indexing | **[done]** | No `/preview` tree left; root is indexable (`robots: index/follow` in `app/layout.tsx`). |
| 1.6 | canonical/hreflang | **[done]** | Handled at root in [`app/_site/seo.ts`](../app/_site/seo.ts); hreflang is `en`-only while `I18N_ENABLED` is false. |

---

## 2. Content

- **2.1 — Sparse blog. [open]** Still one post (`content/building-car-price-predictor.mdx`). The
  blog index's category chips + "featured + all posts" layout is built for many posts; it hides
  the "all posts" section gracefully with one, but add 2–4 real posts before launch to fill it out.
- **2.2 — mRFEI case study deactivated. [done]** Hidden from listings + route 404s; source kept
  in [`app/_site/mrfei/`](../app/_site/mrfei/). Figures were always illustrative — if reactivated,
  note that or wire real data.
- **2.3 — Backend-dependent pages. [done]** Dashboard / Predict / Drift / SHAP call the Railway
  API; the site reaches the backend from production (confirmed). They still render clean
  error/empty states if it goes down, so the pages degrade gracefully.

---

## 3. Internationalization

- **3.1 — English-only for now. [done, by decision]** The site ships EN + TR dictionaries, but
  Turkish is deactivated via `I18N_ENABLED = false` ([`app/_site/i18n-config.ts`](../app/_site/i18n-config.ts)),
  so only English renders and no `/tr` routes are advertised. TR strings stay in place to switch back on.
- **3.2 — TR copy is native-quality. [done]** Full pass over the `i18n.tsx` TR table (EN/TR parity)
  + `home/content.ts` — ready for whenever Turkish is re-enabled.
- **3.3 — Blog bodies aren't localized. [watch]** MDX posts are English only; `localize()` switches
  chrome, not article bodies. Fine while EN-only; revisit if TR is turned on.

---

## 4. Accessibility

- **4.1 — Contact form labels. [open]** In [`FinalAbout.tsx`](../app/_site/FinalAbout.tsx) fields
  still use a `FieldLabel` **div**, not a `<label htmlFor>`/`id` pair — labels aren't
  programmatically associated. Wire `htmlFor`/`id` (or wrap inputs in `<label>`).
- **4.2 — Icon-only controls. [done]** The theme toggle is gone (light-only); the sidebar collapse
  toggle and lang switch carry `aria-label`s. Spot-check nothing regressed.
- **4.3 — Colour contrast. [open]** Muted greys (`#86857e`, `#9a9a92`) on paper for small captions
  (11–12px) may fall short of WCAG AA (4.5:1). Spot-check and darken where needed.
- **Positive:** no raw `<img>` without `alt` (figures are inline SVG); a global `:focus-visible`
  ring and `prefers-reduced-motion` reset were added in [`app/globals.css`](../app/globals.css).

---

## 5. Performance

- **5.1 — Plotly trimmed. [done]** Report uses the `cartesian` partial bundle (~460 kB gzip vs
  ~1.2 MB) + IntersectionObserver lazy-mount + debounced `ResizeObserver` re-fit.
- **5.2 — ECharts full bundle. [open, optional]** `echarts-for-react` loads the full ECharts on
  the dashboard, EDA, and the marketing hero/thumbnail figures. Acceptable; a custom ECharts build
  (only the used chart/coord/renderer modules) would shrink it if bundle size matters at launch.
- **5.3 — No `next/image`. [done/n-a]** The site avoids raster images (SVG figures), so no
  image-optimization gap — but the future OG image (1.3) should be static/edge-generated, not large.

---

## 6. Dead / unused code

- **6.1 — Old shells removed. [done]** `SiteFrame`, `Navbar`, `ThemeToggle`, and the old
  `PortfolioHome` are deleted; marketing pages use [`PaperShell`](../app/_site/PaperShell.tsx).
- **6.2 — Preview sandboxes removed. [done]** `app/preview/**` (a / b / charts / final) is gone —
  the redesign is the root.
- **6.3 — mRFEI source retained. [watch]** [`app/_site/mrfei/**`](../app/_site/mrfei/) is kept but
  unreferenced per the deactivation decision.

---

## 7. Branding / consistency

- **7.1 — Favicon = `sc.` monogram, "ink" variant. [done]** Dark tile, cream `S`, emerald dot —
  `app/favicon.ico` + `app/icon0.svg` + `app/apple-icon.png` + maskable PWA icons in `/public`.
  The previous icon set is backed up (gitignored `favicon-backup/`).
- **7.2 — Contact email = `s.c_2004@hotmail.com`. [done]** Single source in `site.social.email`.
- **7.3 — Lowercase `sc.` wordmark. [done]** Consistent everywhere via
  [`Monogram.tsx`](../app/_site/Monogram.tsx); the old text mark + chart-glyph icon are gone.

---

## 8. Remaining before launch

1. Add an **OG image** + set `openGraph.image` / `twitter.image` → `summary_large_image` (1.3).
2. Add **blog content** (2–4 posts) or accept the one-post index (2.1).
3. Fix **contact-form label association** (4.1).
4. **Contrast** spot-check on small muted captions (4.3).
5. _(optional)_ Custom **ECharts** build to trim bundle (5.2).
