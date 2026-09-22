# Used Car Market Analysis — Technical Report

This report answers two questions: what sets a used-car price, and how accurately the model can predict it. The analysis runs over **29,988** Turkish-plated BMW/Audi listings — from cleaning and leakage checks through controlled price effects, market structure, model comparison and time tests. LightGBM is off by **6.5%** on average (MAE: **₺110K**, R²: **0.9744**), **42%** better than the median of the same model and year. Every metric here is computed **5-fold out-of-fold**, on data the model never saw in training.

## 1. Data cleaning and leakage detection

**45,159 snapshots → 29,988 listings.** The 15,171 rows between are the same ad re-scraped: scrape residue, not data. Latest snapshot per `ad_id`.

Median asking price ₺1.54M, ranging ₺0.84M–₺3.42M (P10–P90).

**Scope: Turkish-plated vehicles only.** Foreign/blue-plate listings, and listings with no plate information, are excluded from the study. Their different tax regime would mislead both the model and the analysis, so they are out of scope.

### Scale

| item | value |
|---|---:|
| raw rows (all snapshots) | 45,159 |
| unique listings (`ad_id` dedup) | 29,988 |
| snapshots | 4 (2026-01-18 – 2026-06-27) |
| model features | 25 |
| BMW / Audi | 17,896 / 12,092 |
| target | `log1p(price)` |

### Three data layers

1. **Structural** — age · km · engine power/size · body · fuel · transmission · drivetrain · segment.
2. **Damage / inspection** — every body panel × {changed, painted, local paint} + tramer record + heavy damage.
3. **Free text** — the seller's description; **not used** by the model. It was measured and added nothing; the detail is in §10.

### Kept features (25)

Model (`model`) · Series (`series`) · Brand (`brand`) · Body Type (`kb_body_type`) · Drivetrain (`kb_drivetrain`) · Segment (`segment`) · Transmission (`kb_transmission`) · Fuel Type (`kb_fuel`) · Roof State (`roof_state`) · Hood State (`hood_state`) · Trunk State (`trunk_state`) · Age (years) (`vehicle_age`) · Mileage (`gb_mileage`) · Power (hp) (`power_hp_val`) · Engine (cc) (`engine_cc_val`) · Door Changed (`door_changed`) · Door Painted (`door_painted`) · Door Local Paint (`door_local`) · Fender Changed (`fender_changed`) · Fender Painted (`fender_painted`) · Fender Local Paint (`fender_local`) · Bumper Changed (`bumper_changed`) · Bumper Painted (`bumper_painted`) · Bumper Local Paint (`bumper_local`) · Heavy Damaged (`is_heavy_damaged`)

### Dropped feature groups

| group | reason | ~cols |
|---|---|---:|
| A | Constant variance | ~2 |
| B | Redundant kb/gb twins | ~12 |
| B* | Coverage difference | 1 |
| C | Identity / leakage | ~8 |
| D | Block-missing >40% | ~15 |
| E | Spec-missing ~26% | ~10 |

Missing values are filled with a series > segment > brand median hierarchy; `torque_nm`, missing in 27.6% of listings, was dropped from the analysis.

**Leakage control.** Dedup runs on `ad_id`, before the CV split. Evaluation is 5-fold out-of-fold: every listing is predicted exactly once, by a model that never saw it.

### Content-based duplication

| definition | excess rows | share |
|---|---:|---:|
| strict — every distinguishing field identical | 137 | 0.46% |
| loose | 209 | 0.70% |

The risk `ad_id` cannot see: different `ad_id`, same car. 127 duplicate groups. Strict-definition columns: `price`, `gb_mileage`, `gb_year`, `brand`, `series`, `model`, `kb_fuel`, `is_heavy_damaged`, `count_painted`, `count_changed`, `power_hp_up`, `engine_cc_up`. Some are genuine re-posts, some coincidental matches on common models; either way the share that could leak across folds is under 1%.

Most repeated listings:

| model | year | price | repeats |
|---|---:|---:|---:|
| 320i Sport Line | 2025 | ₺4,900,000 | 4 |
| 318i Standart | 2005 | ₺717,000 | 3 |
| A3 Sportback 1.6 Ambition | 2010 | ₺890,000 | 3 |
| 116d Joy Plus | 2015 | ₺1,044,950 | 3 |
| 320i First Edition Sport Line | 2019 | ₺2,530,000 | 3 |

## 2. Missingness isn't random

30 columns are over 2% missing and a block of them drops **together**. This isn't "missing data", it's listings where catalog matching collapsed: standard models match, niche variants don't, and all their specs go blank at once. Because it is systematic, reliable imputation is impossible → dropped.

![Missing rate (%) — same rate = co-missing block](figures/en-16-missing.png)

### Co-missing blocks

| cols | avg missing | missing together | example columns |
|---:|---:|---:|---|
| 15 | 27.6% | 98.8% | `weight_kg`, `kb_fuel_tank`, `gb_segment`, `torque_nm` … |
| 2 | 31.4% | 100.0% | `city_fuel_cons`, `highway_fuel_cons` |
| 2 | 29.9% | 100.0% | `production_year_start`, `production_year_end` |
| 2 | 29.3% | 100.0% | `rpm_max`, `rpm_min` |

**Missingness correlation 1.0 ≠ value correlation (~0.59).** What co-moves is the columns' *present/absent* state; their values carry separate information. What they share is the source: catalog matching.

### gb_ / kb_ dual source

| field | Overview (gb) empty | QuickInfo (kb) twin |
|---|---:|---|
| Drivetrain (`gb_drivetrain`) | 74.0% | `kb_drivetrain` · missing 1.5% |
| Avg. Traffic Insurance (`gb_traffic_insurance_avg`) | 54.3% | none |
| Avg. Casco Insurance (`gb_kasko_avg`) | 51.1% | none |
| Annual Vehicle Tax (`gb_mtv_yearly`) | 40.6% | none |

The same field can appear in two different tabs of a listing page. To keep it out of the model twice, for overlapping fields we kept the side with fuller data (`kb`). The 3 fields with no counterpart and over 40% empty (insurance and tax) were dropped.

**What kb/gb are.** `kb` is the quick-info tab, `gb` the overview tab. Both state much the same things. To avoid feeding the model the same fact twice we reduced each pair to one column: rather than patching one side with the other, we kept the fuller one and deleted the other.

## 3. Redundancy, dependence and brand

Cramér's V gives association strength (symmetric); Theil's U its direction (asymmetric). The asymmetry is the finding: `model` almost fully determines the rest but not vice-versa — `series` is a coarsened view of `model`, not independent information.

![Theil's U (directional dependence)](figures/en-17-theils-u.png)

![Cramér's V (symmetric association)](figures/en-18-cramers-v.png)

![Every series lands in exactly one segment — median price (₺M)](figures/en-19-series-segment.png)

### Theil's U asymmetry

| direction | reads as | U |
|---|---|---:|
| U(series \| model) | how much model pins down series | 0.999 |
| U(model \| series) | how much series pins down model | 0.387 |
| U(brand \| model) | brand given model | 1.000 |
| U(brand \| series) | brand given series | 1.000 |

Model determines series at 1.00; series determines model only at 0.39. Brand is fully readable from either model or series → brand carries no separate information (the brand ablation below measures the same thing).

Correlation among numeric features — the numeric counterpart to the categorical dependence above. |r|>0.5 pairs are flagged for collinearity (also checked via VIF, §6).

![Pearson](figures/en-20-pearson.png)

![Spearman](figures/en-21-spearman.png)

### High-correlation pairs (|r| > 0.5)

| feature A | feature B | Pearson r |
|---|---|---:|
| Age (years) | Mileage | 0.737 |
| Power (hp) | Engine (cc) | 0.730 |
| Door Painted | Fender Painted | 0.670 |

### Brand ablation

| identity columns | MAPE | MAE | R² |
|---|---:|---:|---:|
| brand only | 7.17% | ₺125K | 0.9679 |
| series + model | 6.50% | ₺110K | 0.9744 |
| brand + series + model (the report's model) | 6.50% | ₺110K | 0.9744 |

Only the identity columns change in the full model, everything else fixed; same 5-fold OOF. Giving brand alone instead of series+model worsens MAE by ₺15K. Adding brand on top of series+model changes MAE by ₺0 (MAPE delta 0.00 pts) → once model is known, brand carries no information. U(brand | model) = 1.00 above is the dependence side of the same fact.

## 4. Target and preprocessing

Raw price is right-skewed (skew 1.62); a log transform pulls it toward symmetry (0.28). The model trains on `log1p(price)`: under squared loss the extremes were swallowing the whole error budget. A modelling decision, not a market finding.

![Price histogram — all data (dashed line = median)](figures/en-25-price-hist.png)

![Median price by body style](figures/en-01-body-median.png)

## 5. Market structure — segmentation (KMeans + PCA)

**k=3 was not chosen by silhouette.** Silhouette at k=3 is 0.146 — rank 7 of the 7 values tried; the highest is k=8 (0.211). All sit below 0.25: the data has no pronounced natural clusters. k=3 was fixed for interpretability; read the clusters through the axes below, not as "the market's natural structure". The damage signal still appearing independently across the hedonic model, PCA and KMeans is a robustness check.

![k selection — Elbow + Silhouette](figures/en-24-k-selection.png)

![PCA — PC1 19.7% × PC2 12.4%](figures/en-22-pca-scatter.png)

![PCA — PC1 19.7% × PC3 11.0%](figures/en-23-pca-scatter-13.png)

### Axes separating the clusters

| cluster | listings | top 3 axes vs the mean |
|---|---:|---|
| Older, high-km economy · 5% heavy damage | 9,046 | Mileage ↑ · Fender Local Paint ↑ · Engine (cc) ↑ |
| Newer, clean premium | 15,976 | Mileage ↓ · Age (years) ↓ · Engine (cc) ↓ |
| Older, high-km economy · 13% heavy damage | 4,966 | Door Painted ↑ · Fender Painted ↑ · Fender Changed ↑ |

↑/↓ = cluster mean above/below the overall mean (top 3 by z-score magnitude). Clusters the producer gave the same name separate in this column.

### PCA loadings

| PC | variance | top 4 loadings |
|---|---:|---|
| PC1 | 19.7% | Mileage (+0.46) · Age (years) (+0.45) · Fender Painted (+0.41) · Door Painted (+0.41) |
| PC2 | 12.4% | Power (hp) (+0.65) · Engine (cc) (+0.61) · Fender Painted (-0.24) · Door Painted (-0.24) |
| PC3 | 11.0% | Fender Local Paint (+0.58) · Door Local Paint (+0.57) · Power (hp) (-0.28) · Bumper Local Paint (+0.22) |

The first 3 components explain 43.1% of variance. PC1 ≈ Mileage + Age (years) · PC2 ≈ Power (hp) + Engine (cc) · PC3 ≈ Fender Local Paint + Door Local Paint.

## 6. Hedonic model — controlled effects

The hedonic regression gives each driver's *controlled* effect on price (all else equal) — R² **0.9309**, n **29,554**. Coefficients carry bootstrap confidence intervals; all 10 terms have a 95% CI excluding zero → each driver is reliably significant.

**Note:** The hedonic model is an OLS and cannot run with missing values, so listings with missing engine power (426) or missing displacement (356) were removed before the analysis. Once the rows missing both are counted only once, 434 rows in total were dropped from the dataset.

![Bootstrap coefficients (point + 95% CI)](figures/en-03-bootstrap-ci.png)

### Bootstrap coefficients

| term | effect | log coef [95% CI] | effect 95% CI | significant |
|---|---:|---:|---:|---|
| age | -7.12% | -0.0739 [-0.0761, -0.0715] | -7.33% … -6.90% | yes |
| age² | +0.08% | +0.0008 [+0.0007, +0.0010] | +0.07% … +0.10% | yes |
| km (100K) | -14.58% | -0.1576 [-0.1674, -0.1479] | -15.41% … -13.75% | yes |
| km² | +1.73% | +0.0172 [+0.0144, +0.0202] | +1.45% … +2.04% | yes |
| age×km | -0.66% | -0.0066 [-0.0078, -0.0055] | -0.78% … -0.55% | yes |
| heavy damage | -11.40% | -0.1210 [-0.1297, -0.1118] | -12.16% … -10.58% | yes |
| painted | -1.05% | -0.0106 [-0.0115, -0.0096] | -1.14% … -0.96% | yes |
| changed | -3.10% | -0.0314 [-0.0336, -0.0294] | -3.30% … -2.90% | yes |
| +100 HP | +21.34% | +0.1935 [+0.1759, +0.2119] | +19.23% … +23.60% | yes |
| +1 litre | +7.71% | +0.0742 [+0.0504, +0.0979] | +5.17% … +10.29% | yes |

Effect = exp(β)−1. Squared and interaction terms (age², km², age×km) are not read alone; they carry the curvature.

### Engine effect

+100 HP → **+21.3%**, +1 litre → **+7.7%** (same regression, the other held fixed). Displacement's effect is what remains once power is fixed; the units differ, so the two numbers are not directly comparable.

### cc–HP correlation by fuel

| fuel | Pearson | Pearson (log) | Spearman | cc / HP | n |
|---|---:|---:|---:|---:|---:|
| Petrol | 0.806 | 0.731 | 0.407 | 9.8 | 14,693 |
| Diesel | 0.836 | 0.863 | 0.694 | 11.1 | 12,783 |
| LPG & Petrol | 0.900 | 0.863 | 0.805 | 13.9 | 1,199 |
| Hybrid | 0.429 | 0.522 | 0.308 | 10.0 | 879 |

Overall correlation 0.73. The relationship varies by fuel — weakest for Hybrid (Pearson 0.429, n 879). Displacement cannot be derived from power; both stay as separate features.

### VIF — multicollinearity

| term | VIF |
|---|---:|
| age | 2.57 |
| km | 2.36 |
| heavy damage | 1.05 |
| painted | 1.22 |
| changed | 1.11 |
| +100 HP | 2.88 |
| engine (L) | 3.19 |

Highest **engine (L) 3.19** — all below 5; collinearity is not distorting the coefficients.

### Assumption tests

Breusch-Pagan (equal variance) p = **<0.001** · Jarque-Bera (normality) p = **<0.001** → both violated. Inference therefore does not use naive OLS p-values but **HC3** robust standard errors + **1000×** bootstrap.

LOFO is a second, independent method: drop each feature and measure how much CV error grows. That it produces the same ranking is the finding.

![LOFO — ΔRMSE when a feature is removed (non-overlapping groups)](figures/en-04-lofo-flat.png)

The chart shows 5 bars while the model uses 25 features. Coverage:

| coverage | features | where |
|---|---:|---|
| measured singly | 19 | 2 as their own bar, 17 inside the groups |
| measured as a group | 3 | `DAMAGE_COLS` · `MODEL_SERIES` · `ENGINE` |
| **never measured** | **6** | `brand` · `kb_body_type` · `kb_drivetrain` · `segment` · `kb_transmission` · `kb_fuel` |

## 7. Model comparison and limitations

The report's model: **LightGBM (model/series name TF-IDF+SVD)** — MAPE **6.5%**, R² **0.9744**, MAE **₺110K**. Target `log1p(price)`, 25 features. 42% better than the model+year median baseline.

**What TF-IDF+SVD is applied to.** Not the free-text description — only the `model` and `series` name strings (e.g. "A4 Sedan 2.0 TDI"). The point is to let rare name combinations borrow information from their neighbours through name similarity, covering exactly where target encoding weakens in sparse cells. The seller's description never enters the model (see §1, third layer).

### Model variants

| variant | MAPE | R² | MAE | MedAE | RMSE |
|---|---:|---:|---:|---:|---:|
| LightGBM (model/series name TF-IDF+SVD) | 6.50% | 0.9744 | ₺110,072 | ₺75,282 | ₺176,576 |
| CatBoost (model/series name TF-IDF+SVD) ★ | 6.45% | 0.9742 | ₺110,294 | ₺74,660 | ₺177,186 |
| CatBoost (model/series name native text) | 6.59% | 0.9734 | ₺113,125 | ₺77,772 | ₺179,772 |
| model+year median (baseline) | 11.20% | 0.9235 | ₺191,224 | ₺130,000 | ₺305,050 |

★ = winner under the producer's rule (MAPE only): **CatBoost (model/series name TF-IDF+SVD)**. But the two TF-IDF+SVD variants differ by 0.05 MAPE points and ₺222 MAE; LightGBM leads on MAE, RMSE, R², CatBoost on MAPE, MedAE → in practice they are **tied**. Throughout this report "the model" is LightGBM: deterministic on CPU, whereas CatBoost's trees depend on the device (GPU/CPU) — the published GPU run had the MAPE order reversed. The conformal interval, brand ablation and sample predictions all come from LightGBM.

### Baseline tier breakdown

| tier | listings | share | MAPE | MAE | R² |
|---|---:|---:|---:|---:|---:|
| model + year | 29,236 | 97.49% | 10.69% | ₺179K | 0.9450 |
| model | 596 | 1.99% | 26.70% | ₺559K | 0.6082 |
| global | 156 | 0.52% | 47.38% | ₺1.10M | -0.2359 |

Ladder: (model, year) median → (model) median — all years → global median. If the test (model, year) cell is absent from the training fold, the baseline steps down a rung; error grows sharply at each step — without a comparable the baseline is weak anyway. Medians are computed on the training part of each fold only (leak-free, same 5 folds as the model).

**Model limitations and observations.** Prediction errors come mainly from implicit information that never reaches the form fields and hides in the free text: modifications, special equipment, tax-exemption status. Likewise, for niche luxury and sports cars with few comparables in the dataset, the error grows markedly because the sample is too thin. Since the performance ceiling is set by data coverage rather than algorithm settings, no extensive hyperparameter optimisation was run — its marginal gain would be small.

### Sample predictions

| band | car | age | km | actual | LightGBM | dev. | OOF resid. | CatBoost (model/series name SVD) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| economy | A3 Sportback 1.4 TFSI Attraction | 16 | 216,000 | ₺770,000 | ₺754,463 | 2.0% | 0.0% | ₺796,416 |
| mid | 520i Premium | 13 | 230,000 | ₺1,525,000 | ₺1,527,918 | 0.2% | 0.0% | ₺1,492,718 |
| premium | A3 Sedan 35 TFSI Advanced | 1 | 11,000 | ₺2,867,000 | ₺2,832,053 | 1.2% | 0.0% | ₺2,879,939 |

> **These are best-case examples, not typical ones.** In each price tercile the producer picks the non-heavy-damaged listing with the smallest |OOF residual|. "dev." is the final model trained on all data (it saw the listing); the leak-free measure is "OOF resid.". For typical error see MAPE.

## 8. Calibration, residuals and where it is weak

OOF (leak-free) predictions vs actual — R² **0.9744**. Residual% centers on zero (mean -0.48%, std 9.31%) → no systematic bias.

![Predicted vs Actual (R² 0.974)](figures/en-08-pred-vs-true.png)

### Error distribution

| \|error\| band | listings | share |
|---|---:|---:|
| ≤ 5% | 15,725 | 52.4% |
| 5% – 10% | 8,251 | 27.5% |
| 10% – 20% | 4,825 | 16.1% |
| > 20% | 1,187 | 4.0% |

![OOF error distribution — residual % = (actual − predicted) / actual](figures/en-26-error-hist.png)

OOF error for all 29,988 listings. The distribution peaks at zero (median residual -0.26%); the share of listings within ±10% is **80.0%**. Mean |error| is 6.5% — the MAPE itself; median |error| 4.7%. The tails are asymmetric, the over-prediction side is heavier: the model says more than 20% **above** the actual price for 761 listings and more than 20% **below** it for 426 (extremes -178.4% and +55.3%). Part of the asymmetry is by definition: the residual is divided by the actual price, so under-prediction is capped at 100% while over-prediction is unbounded. The std (9.31%) is inflated by that tail; median |error| describes the typical miss better.

### Where the large errors come from

There are 1,187 listings with an error beyond ±20% (761 over-, 426 under-predicted). The breakdowns below are counted from structured fields only — no text detector involved.

| listings of the same model+year | listings | large error | over-predicted | under-predicted |
|---|---:|---:|---:|---:|
| 1 | 610 | 19.2% | 11.5% | 7.7% |
| 2–4 | 1,584 | 10.6% | 6.3% | 4.3% |
| 5–19 | 5,732 | 4.6% | 3.0% | 1.6% |
| 20–99 | 16,505 | 2.9% | 1.9% | 1.0% |
| 100+ | 5,557 | 2.8% | 1.9% | 0.9% |

1. **No comparable.** With no other listing of the same model and year the large-error rate is 19.2%; with 100+ comparables 2.8%. The model cannot price a car it has not seen.
2. **Exotic or old car.** 20.6% in the F/S segments (others 3.8%); 11.6% at age ≥ 18 (younger 3.2%). The form fields cannot explain the price differences among these cars.
3. **Time.** The model is time-blind: median residual -3.39% in the first snapshot (2026-01-18), +1.42% in the last (2026-06-27) — as the market rises it first says too expensive, then too cheap.

Association; not verified listing by listing. Information absent from the form (damage history, equipment, modifications) is a likely contributor, not measured here.

#### Examples

| car | year | km | price | model estimate | residual |
|---|---:|---:|---:|---:|---:|
| BMW 640i | 2011 | 160,000 | ₺5,600,000 | ₺3,238,105 | +42.2% |
| Audi 4.2 FSI Quattro R-tronic (R8) | 2008 | 112,550 | ₺4,690,000 | ₺2,610,304 | +44.3% |
| BMW 750i Long | 2007 | 271,000 | ₺1,190,000 | ₺3,115,921 | -161.8% |

- **BMW 640i · 2011:** Per the ad text the car is a full M6 conversion: M6 engine and M6 body parts. The form still says 640i, so the model prices an ordinary 640i while the buyer is looking at an M6.
- **Audi 4.2 FSI Quattro R-tronic (R8) · 2008:** The only R8 in the data. Its model name on the form is just "4.2 FSI Quattro R-tronic"; the S5 4.2 FSI Quattros sharing that engine name have a median of ₺2.62M, and the model's estimate is almost exactly that. With no comparable, the model priced a supercar like the similarly named S5.
- **BMW 750i Long · 2007:** There are two listings under this name; the other is a ₺5.3M converted 2009 car. This listing is in line with same-year 730ds (15 listings, median ₺1.18M) and its text says well-maintained with no pending costs. The listing is priced right and the model is wrong: lacking a comparable, it is probably pulled up by the name's other, expensive listing.

![Residual% vs Predicted](figures/en-09-residual.png)

![Fewer comparables, larger error — median error per model](figures/en-11-n-vs-error.png)

Each point is a model; the y axis is the median error across that model's listings. The bucket median is 10.1% for single-listing models and 4.6% for models with 100+ listings. The table above measures differently in two ways: it counts the **rate** of large errors and groups listings by model+**year**. Both point the same way — fewer comparables, larger error.

**A conformal interval** is a data-based price band the model offers alongside its single price (e.g. ₺1.34M – ₺1.78M).

* **No distributional assumption:** Errors are not assumed to follow a formula (a bell curve, etc.). The model's real errors on cars it has never seen are sorted, the worst 10% are set aside, and the margin is read directly from the data. The one assumption is that new listings resemble past ones — as the market drifts (§9), that assumption weakens.
* **Proportional:** The margin is applied as a percentage, not in lira (roughly 13% below to 15% above the estimate). So the lira band is wide for expensive cars and narrow for cheap ones.
* **Limitation:** Because one percentage is applied to the whole market, the band is too narrow for cheap cars, where the model errs more in proportional terms (see the coverage chart below). The fix is to compute the margin separately for each price band instead of as a single number; this was not done in this report.

**The weakness is price-dependent:** median error is 6.97% in the cheapest quartile and 3.54% in the most expensive. The 90% conformal interval does not hold everywhere; Q1 coverage, for instance, is 81.6%.

![Median error by price quartile (%)](figures/en-10-quartile-error.png)

![How often the 90% range held (target 90%)](figures/en-12-coverage.png)

| quartile | price range | coverage |
|---|---|---:|
| Q1 | below ₺1.15M | 81.6% |
| Q2 | ₺1.15M – ₺1.54M | 91.9% |
| Q3 | ₺1.54M – ₺2.27M | 92.6% |
| Q4 | above ₺2.27M | 94.1% |

**Note:** The price quartiles are cut on actual values. Overall coverage is 90.0% by construction; only Q1 falls below the target.

### Best 5 predictions

| model | age | km | actual | OOF pred. | error |
|---|---:|---:|---:|---:|---:|
| A3 Sedan 35 TFSI Advanced | 1 | 11,000 | ₺2,867,000 | ₺2,867,018 | 0.0% |
| 520i Premium | 13 | 230,000 | ₺1,525,000 | ₺1,524,988 | 0.0% |
| 525d xDrive Exclusive | 13 | 235,000 | ₺1,680,000 | ₺1,679,985 | 0.0% |
| 320i ED Luxury Line | 13 | 210,036 | ₺1,359,000 | ₺1,359,014 | 0.0% |
| A3 Sportback 1.6 TDI Design Line | 8 | 112,750 | ₺1,690,000 | ₺1,689,980 | 0.0% |

Across 29,988 listings a few predictions landing within a few lira of the truth is expected by chance alone; this table shows the zero end of the error distribution, not typical quality.

### Worst 6 predictions

| model | age | km | actual | OOF pred. | error |
|---|---:|---:|---:|---:|---:|
| A4 Sedan 2.0 TDI | 20 | 355,000 | ₺644,000 | ₺1,792,742 | 178.4% |
| 750i Long | 19 | 271,000 | ₺1,190,000 | ₺3,115,921 | 161.8% |
| 745i Long | 21 | 280,000 | ₺885,000 | ₺2,066,226 | 133.5% |
| M2 | 10 | 153,000 | ₺1,650,000 | ₺3,325,961 | 101.6% |
| 1.8 1.8 T | 20 | 96,000 | ₺950,000 | ₺1,816,088 | 91.2% |
| 320i ED M Plus | 13 | 240,000 | ₺1,400,000 | ₺2,584,235 | 84.6% |

In 6 of the worst 6 the model says **more** than the actual price; median age 20. Something invisible in the structured fields (damage history, project car, rare variant) is a plausible explanation — not verified listing by listing here. All predictions are OOF; the listing id (`ad_id`) is deliberately not published.

## 9. Time — period effect, distribution drift and backtest

Two lines of evidence give the same call. Distribution drift: the period curves nearly overlap. Temporal backtest: train on an earlier period and test only on the next period's NEW listings (leak-free). Verdict: the market LEVEL shifted +5.3% but the SHAPE held → monthly retraining suffices.

### Period effect

| snapshot | price level vs 01-18 |
|---|---:|
| 01-18 (base) | 0.00% |
| 01-27 | +1.54% |
| 03-21 | +3.17% |
| 06-27 | +5.30% |

The hedonic model controls for time with period dummies: for the same car the price level moved **+5.3%** across 4 snapshots. The report's model (LightGBM) is time-blind — it takes no period feature.

### Temporal backtest

| single: train → test | MAPE | n | cumulative: train → test | MAPE | n |
|---|---:|---:|---|---:|---:|
| 01-18 → 01-27 | 6.58% | 2,960 | ≤01-18 → 01-27 | 6.58% | 2,960 |
| 01-18 → 03-21 | 6.80% | 8,182 | ≤01-18 → 03-21 | 6.80% | 8,182 |
| 01-18 → 06-27 | 7.55% | 10,529 | ≤01-18 → 06-27 | 7.55% | 10,529 |
| 01-27 → 03-21 | 6.62% | 7,413 | ≤01-27 → 03-21 | 6.55% | 7,238 |
| 01-27 → 06-27 | 7.31% | 10,313 | ≤01-27 → 06-27 | 7.35% | 10,257 |
| 03-21 → 06-27 | 7.06% | 9,099 | ≤03-21 → 06-27 | 6.96% | 8,889 |

Single = train on one snapshot, predict a later one. Cumulative = train on every snapshot up to t. The test set holds only `ad_id`s never seen in training (leak-free), so cumulative n is at most the single n. From the same training snapshot, error grows as the test horizon lengthens.

### Per-snapshot OOF

| snapshot (standalone) | MAPE | n | cumulative | MAPE | n |
|---|---:|---:|---|---:|---:|
| 01-18 | 7.04% | 10,901 | ≤01-18 | 7.05% | 10,901 |
| 01-27 | 7.00% | 11,254 | ≤01-27 | 6.85% | 13,861 |
| 03-21 | 7.02% | 11,478 | ≤03-21 | 6.52% | 21,099 |
| 06-27 | 7.23% | 11,526 | ≤06-27 | 6.52% | 29,988 |

![More data, less error — single period vs pooled periods](figures/en-15-backtest.png)

### Distribution drift

| snapshot pair | KS | KS p | PSI | EMD (₺) |
|---|---:|---:|---:|---:|
| 01-18→01-27 | 0.0055 | 0.996 | 0.0004 | ₺10,109 |
| 01-18→03-21 | 0.0173 | 0.070 | 0.0015 | ₺20,560 |
| 01-18→06-27 | 0.0309 | <0.001 | 0.0049 | ₺48,059 |
| 01-27→03-21 | 0.0161 | 0.104 | 0.0011 | ₺15,717 |
| 01-27→06-27 | 0.0301 | <0.001 | 0.0038 | ₺39,115 |
| 03-21→06-27 | 0.0157 | 0.118 | 0.0017 | ₺28,620 |

**What the columns measure.** All four compare the **asking-price distribution** of two snapshots (raw price, ₺; every listing live on that day, ~11k per snapshot).

| measure | what it measures, how to read it |
|---|---|
| **KS** | The point where the two distributions differ most; 0–1. How different is "the share of listings below this price" at worst? 0.031 = 3.1 points apart at the widest point. |
| **KS p** | Could the difference be chance? Below 0.05 → it is real. But it says **nothing about size**: with samples of ~11k listings even a tiny difference comes out significant. |
| **PSI** | Is the difference practically large? The first snapshot's prices are cut into 10 bins; how much did those bin shares move in the second? < 0.10 no drift · 0.10–0.25 moderate · > 0.25 large, retrain the model. |
| **EMD (₺)** | How many lira is the difference? How far prices must move on average to turn one snapshot's distribution into the other's. The only measure in lira, so the most directly readable one. |

**What the table says.** Two pairs have KS p below 0.05 — the price distribution really did change between January and June. But the change is small: the highest PSI is 0.0049, about 20× below the "no drift" threshold (0.10). EMD puts it in lira: ~₺10k over nine days, ~₺48k over five months — about 3% of the median asking price (₺1.54M). Drift grows with the distance between snapshots, but not enough to break the structure the model learned.

![Price distribution by snapshot](figures/en-13-drift-hist.png)

![Log-price density by snapshot](figures/en-14-drift-kde.png)

## 10. Free text: measured, left out

The seller's description does **not** enter the model. That is a measurement, not an oversight: under the same cross-validation protocol the structural model scores R² **0.9645** and adding text features gives **0.966** — ΔR² **0.0015**. On top of what the form already carries, text adds no accuracy.

Pulling structured facts out of the text was tried separately: **LangExtract** with **gemini-3.1-flash-lite** extracted damage, maintenance and modification phrases from the ad text, each with a part and a state attribute.

None of it entered the model or this report, because **its accuracy could not be measured**. Measuring it needs a balanced validation set of easy, medium and hard listings, labelled by hand; without that work there is no way to know when the extraction is wrong. We did not build decisions on a signal we could not measure.

What it would take is clear: validate the extractions, then feed them to the model as a **clean signal** and test the gain under the same protocol. Two obstacles. First **sample size**: modified or heavily serviced cars are a small slice of the corpus, and with too few examples the model cannot learn the signal — it stays noise. The other route is to keep the signal out of the model and **drop those listings from the data**, then measure how far the error falls. Either way the result has to be tested on **live listings** before it is trusted.

