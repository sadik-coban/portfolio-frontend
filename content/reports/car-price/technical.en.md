# Car Price — Technical Report

> Generated file — source `clean/data/site_data.json`, generator `clean/car_price_report/build_report.py`. Every number is read from JSON.

Decision summary: [business.en.md](business.en.md)

## 1. Data, dedup and leakage

**45,159 snapshots → 29,988 listings.** The 15,171 rows between are the same ad re-scraped: scrape residue, not data. Latest snapshot per `ad_id`.

Median asking price ₺1.54M, ranging ₺0.84M–₺3.42M (P10–P90).

**Leakage control.** Dedup runs on `ad_id`, before the CV split. Evaluation is 5-fold out-of-fold: every listing is predicted exactly once, by a model that never saw it.

The risk `ad_id` cannot see was checked separately — **content-based duplication**: 137 rows (0.46%) with every distinguishing field identical, 209 (0.7%) under the loosest definition. Real repeats that could straddle folds sit under 1%.

## 2. Missingness isn't random

30 columns are over 2% missing and a block of them drops **together**; co-missing correlation **1.0**. This isn't "missing data", it's listings where catalog matching collapsed: standard models match, niche variants don't, and all their specs go blank at once. Because it is systematic, reliable imputation is impossible → dropped.

![Missing rate (%) — same rate = co-missing block](figures/en-16-missing.png)

## 3. Redundancy and dependence checks

Cramér's V gives association strength (symmetric); Theil's U its direction (asymmetric). The asymmetry is the finding: `model` almost fully determines the rest but not vice-versa — `series` is a coarsened view of `model`, not independent information.

![Theil's U (directional dependence)](figures/en-17-theils-u.png)

![Cramér's V (symmetric association)](figures/en-18-cramers-v.png)

![Every series lands in exactly one segment — median price (₺M)](figures/en-19-series-segment.png)

Correlation among numeric features — the numeric counterpart to the categorical dependence above. |r|>0.5 pairs are flagged for collinearity (also checked via VIF).

![Pearson](figures/en-20-pearson.png)

![Spearman](figures/en-21-spearman.png)

## 4. Hedonic model — controlled effects

The hedonic regression gives each driver's *controlled* effect on price (all else equal) — R² **0.9309**, n **29,554**. Coefficients carry bootstrap confidence intervals; all 10 terms have a 95% CI excluding zero → each driver is reliably significant.

![Bootstrap coefficients (point + 95% CI)](figures/en-03-bootstrap-ci.png)

LOFO is a second, independent method: drop each feature and measure how much CV error grows. That it produces the same ranking is the finding.

![LOFO — ΔRMSE when a feature is removed (non-overlapping groups)](figures/en-04-lofo-flat.png)

> **Note — flat LOFO.** The raw `methodology.lofo` mixes single-feature and group removals; plotting both on one axis double-counts (`DAMAGE_COLS` competes with its own 13 members). The chart above is reduced to **non-overlapping** groups covering 19 of 25 features. The remaining 6 categorical features (`brand`, `kb_body_type`, `kb_drivetrain`, `segment`, `kb_transmission`, `kb_fuel`) are **never measured** by LOFO — the producer only traverses numeric and text features. Read "km and age dominate" within that limit.

## 5. Model comparison and the noise floor

Winner LightGBM (TF-IDF+SVD) — MAPE **6.5%**, R² **0.9744**, MAE **₺110K**. Target `log1p(price)`, 25 features. 42% better than the model+year median baseline.

**Noise floor.** Cars with identical specs (same model · year · km · hp · body) still list **₺77K** apart — 5,767 rows, 2,577 groups. That is a floor: sellers price the same car differently and no model can go below it. The model sits at ₺110K, **1.42×** the floor, so the entire remaining headroom is ₺33K. A hyperparameter search typically claims ~₺5K of that, which is why none was run.

## 6. Calibration, residuals and where it is weak

OOF (leak-free) predictions vs actual — R² **0.9744**. Residual% centers on zero (mean -0.48%, std 9.31%) → no systematic bias.

![Predicted vs Actual (R² 0.974)](figures/en-08-pred-vs-true.png)

![Residual% vs Predicted](figures/en-09-residual.png)

![Per-model sample size vs median error (log axis)](figures/en-11-n-vs-error.png)

## 7. Distribution drift and temporal backtest

Two lines of evidence give the same call. Distribution drift: the period curves nearly overlap. Temporal backtest: train on an earlier period and test only on the next period's NEW listings (leak-free). Verdict: the market LEVEL shifted +5.3% but the SHAPE held → monthly retraining suffices.

![Price distribution by snapshot](figures/en-13-drift-hist.png)

![Log-price density by snapshot](figures/en-14-drift-kde.png)

## 8. Segmentation — KMeans + PCA

k=3 was chosen by silhouette and corroborated with the PCA scatter. The damage signal appearing independently across the hedonic model, PCA and KMeans is a robustness check.

![k selection — Elbow + Silhouette](figures/en-24-k-selection.png)

![PCA — PC1 19.7% × PC2 12.4%](figures/en-22-pca-scatter.png)

![PCA — PC1 19.7% × PC3 11.0%](figures/en-23-pca-scatter-13.png)

## 9. Target and preprocessing

Raw price is right-skewed (skew 1.62); a log transform pulls it toward symmetry (0.28). The model trains on `log1p(price)`: under squared loss the extremes were swallowing the whole error budget. A modelling decision, not a market finding.

![Price histogram — all data (dashed line = median)](figures/en-25-price-hist.png)

![Median price by body style](figures/en-01-body-median.png)

## 10. Reproducibility

- seed: `42` · row order: `ORDER BY ad_id` · LightGBM deterministic: `True` · CatBoost device: `CPU` · n_jobs: `16`

To regenerate this report: `python clean/car_price_report/build_report.py`. To regenerate the data itself: `python clean/build_site_data.py`.
