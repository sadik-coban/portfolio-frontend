# Text Analysis — Technical Report

> Generated file — source `metrics/*.json` + `data/langextract/extraction_results.jsonl`, generator `clean/text_analysis/build_text_report.py`.

Decision summary: [business.en.md](business.en.md)

## 1. What text adds to price accuracy

This is a **measurement**, not a claim: structured-only R² **0.9645**, with text **0.966** → ΔR² **0.0015**. Same OOF protocol. The text's contribution to price accuracy is effectively zero; the rest of the analysis builds on that.

## 2. How the contradiction flag is built

Naive matching gave 1,220 listings. The flag pairs claim type with counter type (no-replacement↔replaced, no-paint↔painted) and **excludes**: blanket structural claims (chassis/engine intact), "except X" statements, local touch-ups only. 1,057 benign cases were filtered → real contradictions **163**.

### Severity

| class | listings | share |
|---|---:|---:|
| light | 71 | 43.6% |
| moderate | 84 | 51.5% |
| heavy | 8 | 4.9% |

| measure | value |
|---|---:|
| painted panels — median / mean | 2 / 2.17 |
| replaced panels — median / mean | 0 / 0.42 |
| no replaced panel at all | 68.7% |
| total-loss / heavy-damage record | 3.1% |

Class definition: `heavy=total-loss/heavy-damage OR 3+ replaced panels · moderate=1-2 replaced or 3+ painted · light=≤2 painted & 0 replaced`

![How many panels painted vs replaced](figures/en-02-panel-dist.png)

### Examples — text says "clean", form has a record

| model | price | painted / replaced | "clean" phrases the detector matched |
|---|---:|---:|---|
| 318i Pure | ₺1,725,000 | 1 / 0 | `hatasız`, `boyasız`, `tramersiz` |
| 520i M Sport | ₺4,149,000 | 1 / 0 | `hatasız`, `boyasız`, `tramersiz` |
| A3 Sportback 1.6 TDI Attraction | ₺1,260,000 | 2 / 0 | `hatasız` |
| A6 Sedan 45 TFSI Quattro Design | ₺4,290,000 | 3 / 0 | `hatasız` |
| 320i ED Luxury Line Plus | ₺1,550,000 | 0 / 2 | `hatasız`, `boyasız` |
| A4 Sedan 2.0 TDI | ₺950,000 | 5 / 0 | `değişensiz`, `boyasız` |
| A6 Sedan 2.0 TDI | ₺1,850,000 | 0 / 1 | `hatasız` |
| 520i M Sport | ₺1,710,000 | 3 / 1 | `orijinal` |

### Examples — reverse direction: text has damage, form is empty

| model | price | painted / replaced | damage phrases the detector matched |
|---|---:|---:|---|
| 320d Standart | ₺1,199,000 | 0 / 0 | `tramer`, `lokal boya`, `değişen` |
| 520d Standart | ₺700,000 | 0 / 0 | `hasar kaydı` |
| M5 | ₺3,500,000 | 0 / 0 | `tramer` |
| 320i ED Luxury Line | ₺1,574,900 | 0 / 0 | `hasar kaydı` |
| 520d Standart | ₺795,000 | 0 / 0 | `tramer` |
| A3 Sedan 1.6 TDI Ambition | ₺1,375,000 | 0 / 0 | `tramer`, `değişen`, `lokal boya` |
| 318i Edition Luxury Line | ₺1,495,000 | 0 / 0 | `değişen` |
| 316i Modern Line | ₺1,159,999 | 0 / 0 | `tramer` |

The reverse direction totals **3,964 listings**: the text describes damage, the counter is empty — where the structured field is missing. The tables carry no raw text, only the words the detector matched; the listing id (`ad_id`) is present in the source but deliberately not written.

## 3. Coverage validation with LangExtract

Ad texts were run once **offline** through Google **LangExtract** for structured extraction (extraction model Gemini 3.1 Flash Lite): **13,904 listings · 41,866 extractions** (avg 3.0 per listing), 13,867 of them fall in the analysis set → coverage **46.2%**. 95.9% of alignments are `match_exact`.

| class | extractions | attributes | most frequent example: input → output |
|---|---:|---|---|
| Damage | 19,800 | part · condition | "sağ ön çamurluk değişen" → condition: değişmiş · part: sağ ön çamurluk (90×) |
| Maintenance | 14,086 | part · condition | "lastikleri yeni durumda" → condition: sıfır/yeni · part: lastik (197×) |
| Modification | 4,433 | part · condition | "m direksiyon" → condition: sonradan takılmış · part: direksiyon (40×) |
| Horsepower | 3,547 | power value | "170 hp" → power value: 170 (382×) |

Example = the **most frequent** (phrase, attributes) pair per class, computed from the file; it is not written unless seen at least 10 times, so no phrase belonging to a single listing enters the report.

### Status vocabulary (Damage class, top 5)

| status | extractions | share of Damage statuses |
|---|---:|---:|
| boyalı (painted) | 5,141 | 26.0% |
| tramer kayıtlı (has a damage record) | 3,856 | 19.5% |
| lokal boyalı (locally painted) | 3,057 | 15.4% |
| değişmiş (replaced) | 2,705 | 13.7% |
| hasar kayıtlı (damage record) | 1,550 | 7.8% |

**Role.** The LLM's status vocabulary was distilled into the regex detectors (`steps/build_text_insights.py` damage vocabulary + modification detector). What runs in production is the **regex**; the LLM is not a price feature and does not run in the pipeline. Because coverage is 13,867/29,988 = 46.2%, the LLM labels are **partial** ground truth: precision measured against the regex is an **agreement rate**, not a "regex error" rate. Since the vocabulary was distilled from the LLM, that measurement is partly circular (it inflates agreement) — read it as a regression test, not independent evidence of accuracy. That test (`obselete/clean-oncesi/code/llm_coverage_test.py`) is not part of the clean chain and was not run for this report.

## 4. The price of a "clean" claim

The chain produces more than one number for the same claim; below each appears with the model it comes from. Each step adds controls to the previous one; how the premium moves along the steps is the confounding itself.

### Premium ladder — contradictory "clean" claim (163 listings)

| step | controls | premium | 95% CI | p | flagged n |
|---|---|---:|---:|---:|---:|
| raw (uncontrolled) | — | -12.8% | — | — | 163 |
| A · specs | age · log km · HP · segment · body · fuel · drivetrain | +0.8% | -1.5% … +3.1% | 0.518 | 161 |
| B · + damage | A + painted · changed · local paint · heavy-damage counters | +1.1% | -1.1% … +3.2% | 0.332 | 161 |
| C · + series | B + series | +1.4% | -0.7% … +3.5% | 0.186 | 161 |
| LightGBM OOF residual | flag-free model (model/series categorical), mean residual of flagged · 400× bootstrap CI | +1.4% | +0.1% … +2.9% | — | 163 |

### Premium ladder — "clean" in the title, damage on the form (2,856 listings)

| step | controls | premium | 95% CI | p | flagged n |
|---|---|---:|---:|---:|---:|
| raw (uncontrolled) | — | -9.4% | — | — | 2,856 |
| A · specs | age · log km · HP · segment · body · fuel · drivetrain | +0.9% | +0.3% … +1.5% | 0.001 | 2,847 |
| B · + damage | A + painted · changed · local paint · heavy-damage counters | -0.1% | -0.7% … +0.4% | 0.677 | 2,847 |
| C · + series | B + series | 0.0% | -0.5% … +0.5% | 0.925 | 2,847 |
| LightGBM OOF residual | flag-free model (model/series categorical), mean residual of flagged · 400× bootstrap CI | -0.2% | -0.5% … +0.1% | — | 2,856 |

**Which number comes from where.** The decision note's +1.4% = step **C** of the first ladder (p 0.19). The LightGBM arm gives the same size but its CI is +0.1% … +2.9% — excluding zero, borderline significant. The +1.9% (n 161) in §5's coefficient table is a **third model**: every text signal simultaneously in one regression; with a different control set and covariates it does not match the ladder one-to-one. In the second population the premium appears only at step A and vanishes once damage counters enter → the word "clean" in the title has no premium of its own; the gap is damage composition.

### Damage status — 3 groups (all listings)

| in the text | listings | median price | controlled difference |
|---|---:|---:|---:|
| damage described | 18,745 | ₺1.43M | — |
| clean claim | 6,004 | ₺2.10M | +2.7% |
| no mention of damage (reference) | 5,239 | ₺1.50M | 0 |

**Descriptive.** Reading the median prices side by side misleads: clean-claim cars are already younger, lower-km and higher-segment. The controlled difference (age · log km · HP · damage counters · segment · brand, HC3) is +2.7% — for **all 6,004 clean-claim listings** versus those not mentioning damage; it is not the premium of the 163 contradictory listings above.

## 5. Controlled coefficients and equipment

All text signals in **one** hedonic log-OLS simultaneously, with HC3 robust SE. n **29,562**, R² **0.9308**. Controls: age · log_km · hp · segment · body · fuel · drivetrain · damage counters · series (HC3 robust SE)

| signal | controlled | 95% CI (HC3) | 95% CI (bootstrap 1000×) | p | raw | n |
|---|---:|---:|---:|---:|---:|---:|
| Premium audio | +5.5% | +4.8% … +6.1% | +4.8% … +6.1% | <0.001 | +83.5% | 3,055 |
| Mod suspension | +5.1% | +3.7% … +6.5% | +3.7% … +6.5% | <0.001 | -9.2% | 418 |
| Mod exhaust | +3.5% | +1.4% … +5.6% | +1.5% … +5.5% | <0.001 | -13.0% | 285 |
| Service history | +3.1% | +1.3% … +4.9% | +1.4% … +5.1% | <0.001 | +18.4% | 226 |
| Franchised service | +2.0% | +1.4% … +2.5% | +1.4% … +2.5% | <0.001 | +53.2% | 3,248 |
| Mod engine/tune | +1.9% | -0.5% … +4.4% | -0.4% … +4.4% | 0.118 | -21.0% | 211 |
| Contradictory 'clean' claim (seller's own form shows damage) | +1.9% | -0.2% … +3.9% | -0.1% … +3.9% | 0.078 | -12.9% | 161 |
| Navigation | +1.5% | +1.0% … +1.9% | +1.0% … +2.0% | <0.001 | +51.3% | 6,558 |
| Heated seats | +1.5% | +1.0% … +2.0% | +1.0% … +2.0% | <0.001 | +44.4% | 6,866 |
| Panoramic roof | +0.9% | +0.5% … +1.3% | +0.5% … +1.3% | <0.001 | +38.0% | 10,749 |
| Driver assist | +0.8% | +0.3% … +1.3% | +0.2% … +1.3% | 0.003 | +91.2% | 5,570 |
| Mod wheels/body | +0.4% | -1.2% … +2.1% | -1.3% … +2.1% | 0.615 | -10.8% | 226 |
| Warranty | +0.1% | -0.4% … +0.6% | -0.4% … +0.6% | 0.767 | +13.5% | 2,878 |
| Leather seats | -0.4% | -0.9% … +0.1% | -0.9% … +0.1% | 0.105 | +22.3% | 4,752 |

> **Controlled ≠ raw.** The raw gap is largely composition; every price claim is reported with vehicle features held constant. These are **associations**, not causation. HC3 and bootstrap intervals nearly coincide → the estimates are stable.

### Equipment coverage

Equipment fields don't exist in the structured schema → text is the only source. 15 terms, negation-safe matching ("no sunroof" is not counted as positive), tolerant of Turkish `ı/i`.

![Equipment mention rate (text is the only source)](figures/en-04-equipment.png)

## 6. Triage — where it misses and which listings to review

### Residual signals

In the 5% slice the model *under-predicts* most (1,500 listings), which text signals appear more than expected? Lift = observed / expected.

![Under-predict signals — concentration in the top 5% (lift)](figures/en-06-residual-signals.png)

> The source carries 1 more signal(s) that are **not robust** — excluded. A signal that fails the robustness test does not belong in a triage list.

### Anomaly queue

| signal / intersection | listings |
|---|---:|
| positive residual tail (price far above expectation) | 1,500 |
| text describing a conversion | 632 |
| HP contradiction (text HP ≫ field HP) | 73 |
| residual ∧ text | 48 |
| residual ∧ HP | 14 |
| **triple** (all three) | **5** |

Each signal alone is noisy; the candidate strengthens as the intersection narrows. Counts are computed on every run.

### Anomaly candidates

| model | age | field HP | text HP | price | model estimate | residual |
|---|---:|---:|---:|---:|---:|---:|
| 750i Long | 17 | 413 | 600 | ₺5,300,000 | ₺2,506,656 | +52.7% |
| M3 | 20 | 343 | 750 | ₺2,900,000 | ₺1,484,399 | +48.8% |
| 640i | 15 | 320 | 650 | ₺5,600,000 | ₺3,299,846 | +41.1% |
| M3 | 14 | 420 | 630 | ₺3,975,000 | ₺3,345,872 | +15.8% |
| 520d M Sport | 19 | 188 | 350 | ₺1,125,000 | ₺953,738 | +15.2% |

> **A review candidate, not evidence.** A high HP in the text can mean an engine conversion or a seller's typo; the call is made by a human, not automatically.

### Field contradiction examples

| model | field | text says | structured field |
|---|---|---|---|
| A3 Sportback 1.6 TDI Sport Line | fuel | Diesel | Petrol |
| 520d M Sport | transmission | Manual | Automatic |
| 420i Gran Coupe Edition M Sport | drivetrain | 4WD | RWD |
| A3 Sedan 35 TFSI Dynamic | body | Sedan | Hatchback |
| 420d M Sport | engine size | 3.0L | 1995 |
| 116i M Sport | year | 2017 | 2012 |
| 335i Standart | hp | 600 | 306 |
| 116i M Sport | model | m6 | 116i M Sport |

The review queue holds 48 rows (equal examples per field); the table shows one per field. Total contradiction counts: model 795 · year 253 · transmission 221 · fuel 86 · hp 73 · drivetrain 53 · engine size 22 · body 10. km is deliberately excluded: text km cannot be told apart from service/purchase/policy km by pattern. Most are seller errors or swap/conversion signs — not evidence.

## 7. Seller, title and ad language

### Seller style

| seller | listings | title ALL CAPS | emoji / ad | exclamation / ad | description length (median chars) | phone mention |
|---|---:|---:|---:|---:|---:|---:|
| Dealer | 20,094 | 90.8% | 0.22 | 0.50 | 784 | 22.9% |
| Private seller | 9,727 | 30.5% | 0.21 | 0.10 | 528 | 1.4% |
| Franchised dealer | 167 | 91.2% | 0.00 | 0.10 | 911 | 38.9% |

Descriptive — by seller type (`gb_seller_type`). No causal claim.

### Ad title mining

| what the title leads with (hook) | share of ads |
|---|---:|
| spec (year / km / engine) | 78.7% |
| equipment | 40.8% |
| clean claim | 30.6% |
| condition / praise | 8.0% |
| urgency / promo | 1.0% |

A title can carry several hooks (shares sum past 100%). Average **8.5 words**. "Clean" in the title but damage on the counters: **2,856 listings**. Title year ≠ field year: **530 listings**. The controlled difference (age · log km · HP · damage counters · segment · brand, HC3) for **all** listings with a clean word in the title is **+2.1%** — no damage condition, versus titles without it; not the premium of §4's contradictory-title population.

### Ad language themes (NMF) — k=3

| theme | listings | share | dominant seller | top-weighted words |
|---:|---:|---:|---|---|
| 1 | 10,409 | 34.7% | Dealer (83.0%) | elektrikli · sensörü · sistemi · koltuklar · led · koltuk · direksiyon · deri |
| 2 | 2,893 | 9.6% | Private seller (97.9%) | oldukça · orijinaldir · herhangi · aracımda · uzun · satıyorum · süre · uzun süre |
| 3 | 16,519 | 55.1% | Dealer (68.1%) | kredi · parça · boya · vardır · yeni · bakımları · hasar · motor |

Themes are the ad's **register** — not price archetypes. Cramér's V with seller type **0.339**: a moderate association; the themes partly re-derive seller type rather than adding price information. Price per theme is deliberately not given (text adds no incremental price information, §1). 167 listings with empty text are not in the themes.

## 8. Privacy and deliberate exclusions

- **Raw ad text never enters.** Example tables carry only the words the detector matched; the LangExtract example is only a generic phrase seen at least 10 times per class.
- **`ad_id` is never written.** It is in the source JSON; the generator drops it.
- **Listing-level rows are published deliberately** (model · price · counters · HP) — the same columns as the old page. Without id and text a row does not point at a listing by itself, but a rare model plus an exact price could be found by searching. That risk is an accepted decision, not an ignored one.
- The `residual_keywords` block is **unused** — review-rejected (trim/colour artefact).
- Non-robust residual signals are excluded.

