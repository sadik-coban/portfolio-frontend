# Text Analysis — Technical Report

> Generated file — generator `clean/text_analysis/build_text_report.py`.

Decision summary: [business.en.md](business.en.md)

## 1. What text adds to price accuracy

This is a **measurement**, not a claim: structured-only R² **0.9645**, with text **0.966** → ΔR² **0.0015**. Same OOF protocol. The text's contribution to price accuracy is effectively zero; the rest of the analysis builds on that.

## 2. How the contradiction flag is built

Naive matching gave 1,220 listings. The flag pairs claim type with counter type (no-replacement↔replaced, no-paint↔painted) and **excludes**: blanket structural claims (chassis/engine intact), "except X" statements, local touch-ups only. 1,057 benign cases were filtered → real contradictions **163**.

Severity definition: `ağır=pert/ağır-hasar VEYA 3+ değişen panel · orta=1-2 değişen ya da 3+ boya · hafif=≤2 boya & 0 değişen`

On average 2.17 painted and 0.42 replaced panels.

![How many panels painted vs replaced](figures/en-02-panel-dist.png)

## 3. Controlled coefficient table

All text signals in **one** hedonic log-OLS simultaneously, with HC3 robust SE. n **29,562**, R² **0.9308**. Controls: yaş · log_km · hp · segment · kasa · yakıt · çekiş · hasar sayaçları · series (HC3 robust SE)

| signal | controlled % | 95% CI | raw % | n |
|---|---:|---:|---:|---:|
| Premium audio | 5.5 | 4.8…6.1 | 83.5 | 3,055 |
| Mod suspension | 5.1 | 3.7…6.5 | -9.2 | 418 |
| Mod exhaust | 3.5 | 1.4…5.6 | -13.0 | 285 |
| Servis kayıtlı | 3.1 | 1.3…4.9 | 18.4 | 226 |
| Yetkili servis | 2.0 | 1.4…2.5 | 53.2 | 3,248 |
| Mod engine/tune | 1.9 | -0.5…4.4 | -21.0 | 211 |
| Aldatıcı 'temiz' iddiası (gizli hasar) | 1.9 | -0.2…3.9 | -12.9 | 161 |
| Navigation | 1.5 | 1.0…1.9 | 51.3 | 6,558 |
| Heated seats | 1.5 | 1.0…2.0 | 44.4 | 6,866 |
| Panoramic roof | 0.9 | 0.5…1.3 | 38.0 | 10,749 |
| Driver assist | 0.8 | 0.3…1.3 | 91.2 | 5,570 |
| Mod wheels/body | 0.4 | -1.2…2.1 | -10.8 | 226 |
| Garanti | 0.1 | -0.4…0.6 | 13.5 | 2,878 |
| Leather seats | -0.4 | -0.9…0.1 | 22.3 | 4,752 |

> **Controlled ≠ raw.** The raw gap is largely composition; every price claim is reported with vehicle features held constant. These are **associations**, not causation.

## 4. Residual signals (triage)

In the 5% slice the model *under-predicts* most (1,500 listings), which text signals appear more than expected? Lift = observed / expected.

![Under-predict signals — concentration in the top 5% (lift)](figures/en-06-residual-signals.png)

> The source carries 1 more signals that are **not robust** — excluded. A signal that fails the robustness test does not belong in a triage list.

## 5. Equipment coverage

Equipment fields don't exist in the structured schema → text is the only source. 15 terms, negation-safe matching ("no sunroof" is not counted as positive), tolerant of Turkish `ı/i`.

![Equipment mention rate (text is the only source)](figures/en-04-equipment.png)

## 6. Coverage validation with LangExtract

Ad texts were run once **offline** through Google **LangExtract** for structured extraction (extraction model Gemini 3.1 Flash Lite): **13,904 listings · 41,866 extractions** (avg 3.0 per listing), 13,867 of them fall in the analysis set → coverage **46.2%**. 95.9% of alignments are `match_exact`.

| class | extractions |
|---|---:|
| Hasar | 19,800 |
| Bakim | 14,086 |
| Modifiye | 4,433 |
| Beygir | 3,547 |

> **Its only job is coverage validation.** These extractions are NOT a price feature; they were used to measure what the regex vocabulary misses. The numbers here are **computed** from `data/langextract/extraction_results.jsonl`, not hand-written.

## 7. Privacy and deliberate exclusions

- Raw ad text **never** enters this report; counts and aggregates only.
- `ad_id` is **never** written: next to a model and a price it points straight at the original listing.
- The `residual_keywords` block is **unused** — review-rejected (trim/colour artefact).
- Non-robust residual signals are excluded.
