# Site Audit — current production vs. final redesign

_Prepared 2026-06-28, before promoting the `/preview/final` redesign onto the root routes._

This audit lists deficiencies in **two** trees:

- **Current production site** — `app/` root routes (`app/page.tsx`, `app/projects/car-price/**`, `app/blog/**`) + `components/`. Cool slate/blue theme, English-only.
- **Final redesign** — `app/preview/final/**`. Warm "paper" theme, EN + TR, the version intended to replace the live site.

Items already handled in the pre-migration pass are marked **[done]**.

---

## 1. SEO & metadata (mostly redesign; blocks a clean migration)

| # | Where | Issue | Action |
|---|-------|-------|--------|
| 1.1 | redesign, all pages | **Placeholder titles** `Final — Home/Report/About/…` (in each `page.tsx` `metadata`). Not SEO-grade; brand template (`%s \| Sadık Çoban`) applies inconsistently. | At migration, write real per-page titles. |
| 1.2 | redesign, all pages | **No per-page descriptions** — every page inherits the generic root description. | Add a unique `description` per route (home, projects, dashboard, eda, report, predict, drift, shap, about, blog, blog/[slug]). |
| 1.3 | site-wide | **No `og:image`**; twitter card is `summary` (not `summary_large_image`). Poor link previews. | Add a default OG image + per-page `opengraph-image.tsx` (can reuse the `ImageResponse` pattern from `app/apple-icon.tsx`). |
| 1.4 | `app/sitemap.ts` | Lists **old paths** (`/projects/car-price/predict`, `/projects/car-price/dashboard`, `/projects/car-price/blog`, `/blog/building-car-price-predictor`). No `/eda`, `/drift`, `/shap`, `/report`, no `/tr` alternates. | Rebuild for the migrated routes incl. TR alternates; verify every entry resolves (200). |
| 1.5 | redesign | **noindex** on the whole `/preview` tree. **[done]** (`app/preview/layout.tsx`). | Remove at migration once content lives at root with real SEO. |
| 1.6 | redesign | Canonical/hreflang point at `/preview/final/...`. | At migration, repoint canonical to root; keep `en`/`tr`/`x-default` (logic in `app/preview/final/seo.ts` — only `BASE` changes). |

---

## 2. Content

- **2.1 — Sparse blog.** Only one post exists (`content/building-car-price-predictor.mdx`). The blog index's category chips + "featured + all posts" layout are built for many posts and look thin with one. Add 2–4 real posts before launch, or simplify the layout until content exists.
- **2.2 — mRFEI case study deactivated. [done]** Hidden from listings + route 404s; source kept in `app/preview/final/mrfei/`. Its figures were always **illustrative** (`mrfei/content.ts` header) — if reactivated for a portfolio, consider a note that data is illustrative, or wire real data.
- **2.3 — Backend-dependent pages.** Dashboard / Predict / Drift / SHAP call the Railway API; they render clean error/empty states when it's down, but the live experience depends on that service being up. Confirm the backend is reachable from the production domain before launch.

---

## 3. Internationalization

- **3.1 — Current site is English-only.** `app/page.tsx`, `app/projects/car-price/**`, `app/blog/**` have no Turkish. The redesign adds EN + TR.
- **3.2 — Redesign TR copy upgraded to native quality. [done]** Full pass over `app/preview/final/i18n.tsx` TR table (282 keys, EN/TR parity verified) + `home/content.ts` + `mrfei/content.ts` (terminology, loanwords, awkward phrasing fixed).
- **3.3 — Blog content is not localized.** MDX posts are English only; `localize()` switches chrome but not article bodies. Decide whether TR blog content is in scope at launch (likely defer).

---

## 4. Accessibility

- **4.1 — Contact form labels.** In `app/preview/final/FinalAbout.tsx`, fields use a `FieldLabel` **div**, not a `<label htmlFor>`/`id` pair — labels aren't programmatically associated. Wire `htmlFor`/`id` (or wrap inputs in `<label>`) for screen-reader/clickable-label support.
- **4.2 — Icon-only / symbol controls.** Spot-check `aria-label`s on icon buttons (mobile menu, theme toggle, lang switch) — most have them; verify none regressed.
- **4.3 — Color contrast.** The warm palette uses muted greys (`#86857e`, `#9a9a92`) on paper for secondary text — check small captions meet WCAG AA (4.5:1); some `faint` tokens may fall short at 11–12px.
- Positive: no raw `<img>` without `alt`; figures are inline SVG.

---

## 5. Performance

- **5.1 — Plotly trimmed. [done]** Report uses the `cartesian` partial bundle (~460 kB gzip vs ~1.2 MB) + IntersectionObserver lazy-mount + idle background loading.
- **5.2 — ECharts on dashboard/EDA.** `echarts-for-react` loads the full ECharts; acceptable, but a custom build (only the used chart/coord/renderer modules) would shrink it if bundle size matters at launch.
- **5.3 — No `next/image`.** Site avoids raster images (SVG figures), so no image-optimization gap today — but the future OG images (1.3) should be static/edge-generated, not shipped large.

---

## 6. Dead / unused code

- **6.1 — `app/preview/final/SiteFrame.tsx`** is not imported anywhere (old cool-theme navbar/footer). Safe to delete; left in place for now.
- **6.2 — Old preview variants** `app/preview/a/**`, `app/preview/b/**`, `app/preview/charts/**` are dev sandboxes (cool themes, old Plotly). Not part of the final site; consider removing before launch to cut build surface (the email change already touched a/b).
- **6.3 — mRFEI source** (`app/preview/final/mrfei/**`) is intentionally retained but currently unreferenced — keep per the deactivation decision.

---

## 7. Branding / consistency

- **7.1 — Favicon = `sc.` monogram. [done]** White-circle `sc.` (`app/icon.svg` + `app/apple-icon.tsx`); old chart-glyph icons removed.
- **7.2 — Contact email = `s.c_2004@hotmail.com`. [done]** Gmail removed from the redesign; matches the old site.
- **7.3 — Lowercase `sc.` wordmark** is consistent across the redesign (Monogram). The current production site still uses the old "Sadık Çoban" text mark + chart-glyph icon — unified once the redesign goes live.

---

## 8. Prioritized action list for migration

1. Move `/preview/final/**` content onto the root routes (`/`, `/projects/car-price/**`, `/blog/**`, `/about`).
2. Remove the interim **noindex** (`app/preview/layout.tsx`) and repoint **canonical** to root.
3. Write real **titles + descriptions** per page; add **OG images** (1.1–1.3).
4. Rebuild **`app/sitemap.ts`** for the new routes + TR alternates; verify all 200 (1.4).
5. Fix **contact-form label association** (4.1).
6. Add **blog content** or simplify the index for one post (2.1).
7. Delete **dead code** (SiteFrame, preview a/b/charts) (6.1–6.2).
8. Verify the **backend** is reachable from production (2.3).
