# Text Analysis — Decision Note

> Generated file — source `metrics/*.json` + `data/langextract/extraction_results.jsonl`, generator `clean/text_analysis/build_text_report.py`. Every number is read or computed from source.

Technical backing: [technical.en.md](technical.en.md)

## What the ad text is and isn't good for

**Not for price accuracy.** Structural data already solves price (R² 0.9645); adding the text improves accuracy by **0.0015** — zero in practice. The value of text is elsewhere: in what the structured fields never record.

## The text says "clean", the form says otherwise

**163 listings** claim clean/undamaged in the text while the seller's **own structural declaration** shows damage. The raw count was 1,220; 1,057 were benign (blanket claims, "except X" statements, local touch-ups only) and were filtered out.

> **This is not hidden damage.** The counters are the seller's own declaration — the information is already in the listing. What contradicts is the showcase text versus the form. This is **not** a fraud claim.

![What the ad actually claimed](figures/en-03-claim-type.png)

![How heavy the damage is, in flagged listings](figures/en-01-severity.png)

Most of the damage is light or moderate: 43.6% light, 51.5% moderate, 4.9% heavy. So "clean" is not outright false in most cases — but the form says otherwise.

## Does that contradiction earn a premium?

On a raw view these listings look **12.8% cheaper** than the rest.

Holding vehicle specs, damage counters and series fixed (the regression's last step), the controlled effect is **+1.4%** (95% CI -0.7% … +3.5%, p 0.19) — not significant. The independent robustness arm (LightGBM residual) gives +1.4%, CI +0.1% … +2.9% — excluding zero, so **borderline** significant. At this group's median price (₺1.40M) that is about **₺20K**.

On the wider population (title says "clean" despite structural damage, 2,856 listings): raw -9.4%, controlled at the same last step **0.0%** (CI -0.5% … +0.5%).

**Verdict: the controlled effect is small: not significant in the regression, borderline in the robustness arm — negligible in practice.** The raw gap comes from composition — controlled ≠ raw.

![Controlled effect (95% CI)](figures/en-05-controlled-effects.png)

## Where the text actually pays

- **Filling gaps:** **3,964 listings** describe real damage in the text while the counter is empty. The structured field is missing there; the text fills it.
- **Equipment:** equipment fields do **not exist** in the structured schema; text is the only source — the most mentioned item appears in **35.9%** of listings.
- **Cross-checking:** text and structured fields disagree across 8 separate fields — a review queue.
- **Anomalies:** **5 listings** where three independent signals meet (price far above expectation · text describing a conversion · text HP above the field HP) — the strongest candidates for a human look.

![Field contradiction count (text ↔ structured)](figures/en-07-field-contradictions.png)

> **An anomaly is a review candidate, not evidence.** This queue is not an accusation list; it orders listings for a human to look at.
