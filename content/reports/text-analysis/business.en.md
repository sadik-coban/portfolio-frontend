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

Most of the damage is mild or moderate: 43.6% mild, 51.5% moderate, 4.9% heavy. So "clean" is not outright false in most cases — but the form says otherwise.

## Does that contradiction earn a premium? No.

On a raw view these listings look **-12.8%** differently priced. But once vehicle specs and damage are held constant the controlled effect is **1.4%** (95% CI -0.7…3.5). On the wider population (title says clean despite structural damage, 2,856 listings): raw -9.4%, controlled **0.0%**.

**Verdict: systematic deception does not earn a premium.** The raw gap comes from composition — controlled ≠ raw.

![Controlled effect (95% CI)](figures/en-05-controlled-effects.png)

## Where the text actually pays

- **Filling gaps:** **3,964 listings** describe real damage in the text while the counter is empty. The structured field is missing there; the text fills it.
- **Equipment:** equipment fields do **not exist** in the structured schema; text is the only source.
- **Cross-checking:** text and structured fields disagree across 8 separate fields — a review queue.

![Field contradiction count (text ↔ structured)](figures/en-07-field-contradictions.png)

> **An anomaly is a review candidate, not evidence.** This queue is not an accusation list; it orders listings for a human to look at.
