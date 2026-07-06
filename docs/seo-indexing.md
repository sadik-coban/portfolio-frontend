# SEO & Indexing — why sitemap URLs aren't showing as indexed in GSC

_Prepared 2026-07-01. The sitemap (`https://www.sadikcoban.com/sitemap.xml`) lists all 14 URLs, but
Google Search Console shows them as not indexed. This note records the diagnosis and what to do._

## TL;DR

**The code isn't blocking indexing.** This is normal behaviour for a new / just-migrated site —
being in the sitemap means "please discover," not "index now." The fix is mostly on the GSC side
(check sitemap status, request indexing, confirm one canonical host) plus time. A few optional
code-health items can strengthen the signals.

---

## 1. Code side: verified clean

Nothing in the app tells Google to skip these pages:

- **Robots meta** — [`app/layout.tsx`](../app/layout.tsx#L36-L39) → `robots: { index: true, follow: true }`.
  The `noindex` used during the pre-migration staging was reverted.
- **robots.txt** — [`app/robots.ts`](../app/robots.ts) → `userAgent: '*'`, `allow: '/'`, and it points
  crawlers at `sitemap.xml`. Nothing disallowed.
- **Canonical / hreflang** — [`app/_site/seo.ts`](../app/_site/seo.ts#L16-L17) → each page's canonical is
  self-referential, `x-default` = the en URL. No cross-domain or mismatched canonical steering Google away.
- **Sitemap** — [`app/sitemap.ts`](../app/sitemap.ts) → URLs match the served XML exactly; with
  `I18N_ENABLED = false` there are no stray `/tr` alternates to confuse coverage.

So the cause is GSC-side / time-based, not a bug.

---

## 2. Why the URLs aren't indexed yet

1. **New site, just promoted to root.** Discovery ≠ instant indexing. For a fresh or recently
   restructured site, indexing typically takes days to weeks (sometimes longer). This is the most
   likely reason on its own.
2. **Likely status: "Discovered – currently not indexed" / "Crawled – currently not indexed."** Google
   found the URLs via the sitemap but hasn't prioritised indexing them. This is common and amplified by:
   - **Low domain authority** — new domain, few/no backlinks.
   - **Thin content** — one blog post, and several routes (dashboard, predict, drift, SHAP) are
     backend-dependent SPA pages that render little static HTML for the crawler.
3. **Host variant mismatch.** The sitemap uses `www.sadikcoban.com`. If the GSC property or the
   `non-www ↔ www` redirect doesn't consolidate to one canonical host, coverage can be split across
   two versions and look worse than it is.

---

## 3. GSC action checklist (your side)

- [ ] **Sitemaps** screen → `sitemap.xml` status is **Success** and "Discovered URLs" > 0. If it's not
      submitted, submit `https://www.sadikcoban.com/sitemap.xml`.
- [ ] **Pages** (Coverage) report → read the exact "not indexed" reason per URL (Discovered vs Crawled
      vs Excluded-by-canonical, etc.). The reason dictates the fix.
- [ ] **One canonical host** → confirm `non-www → www` (or the reverse) 301-redirects, and that the GSC
      property matches. Prefer a **Domain property** so both variants roll up together.
- [ ] **URL Inspection → Request Indexing** for the key pages: home, `/projects`, `/blog`, `/about`.
      This nudges the crawler instead of waiting.
- [ ] **Re-check after ~1–2 weeks.** Indexing is gradual; don't judge it on day one.

---

## 4. Optional code-side health items

These won't *force* indexing, but they improve the signals Google reads. Cross-referenced to
[`docs/site-audit.md`](./site-audit.md):

- **Sitemap `lastModified`** — [`app/sitemap.ts`](../app/sitemap.ts#L10) uses `new Date()`, so **every**
  page's `<lastmod>` becomes the build time on every deploy (all 14 URLs share one timestamp in the
  served XML). When lastmod always changes, Google may stop trusting it. Tie it to real change dates —
  blog posts to their frontmatter/file date, static pages to a fixed date. _(new note — add to audit §1)_
- **No OG image** (audit §1.3) — add `/public/og.png` (or an `opengraph-image` route) and set
  `openGraph.image` / `twitter.image` in `site-config.ts` so cards render `summary_large_image`.
- **Thin blog** (audit §2.1) — 2–4 real posts help pages exit "currently not indexed" and give the
  crawler more reason to return.

---

_No code was changed for this note — it's documentation. The §4 items are future work; ask if you want
the `sitemap.ts` lastmod fix or the OG image implemented as a follow-up._
