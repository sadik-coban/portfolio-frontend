# Car Price — Decision Note

> Generated file — source `clean/data/site_data.json`, generator `clean/car_price_report/build_report.py`. Every number is read from JSON.

Technical backing: [technical.en.md](technical.en.md)

## What's it worth?

A dealer's reflex — *same model, same year, look at the median* — misses by **₺191K** on average. The model misses by **₺110K**: **42% better**, **₺81K** per car.

What it closes is everything beyond model and year: mileage, damage, engine.

![Mean error: dealer reflex vs model](figures/en-00-base-vs-model.png)

**Without a comparable, the baseline collapses.** The model holds everywhere:

| baseline tier | listings | share | mean error |
|---|---:|---:|---:|
| model + year | 29,236 | 97.49% | ₺179K |
| model | 596 | 1.99% | ₺559K |
| global | 156 | 0.52% | ₺1.10M |

## How this market builds a price

Age costs **7.1%** a year, mileage **14.6%** per 100k km — two separate but correlated axes. A low-km old car is where they diverge: it paid the age penalty but not the mileage one, so it stays systematically underpriced.

![Price by age (median + mean)](figures/en-05-age-price.png)

![Price by mileage (median + mean)](figures/en-06-km-price.png)

Unsupervised clustering splits the market into 3 profiles (k=3 was fixed for interpretability; the data has no pronounced natural clusters — see technical §8):

| cluster | listings | median | age | km | engine (hp) | heavy damage |
|---|---:|---:|---:|---:|---:|---:|
| Older, high-km economy · 5% heavy damage | 9,046 | ₺1.32M | 14 | 253k | 177 | 5% |
| Newer, clean premium | 15,976 | ₺1.95M | 9 | 128k | 150 | 2% |
| Older, high-km economy · 13% heavy damage | 4,966 | ₺1.06M | 14 | 247k | 150 | 13% |

> Note: the producer gave two clusters the same name; the separating axis is the **heavy-damage rate** (last column). Names are auto-generated and were not hand-edited.

![Median price by segment](figures/en-02-segment-median.png)

**There is nothing to act on in brand.** Adding brand on top of series+model does not move the mean error (MAPE delta 0.00 pts) — brand already lives inside model.

![Median price: BMW vs Audi](figures/en-07-brand.png)

## Where not to trust the number

The model struggles on cheap cars — error varies sharply by price quartile.

![Median error by price quartile (%)](figures/en-10-quartile-error.png)

**Large misses (beyond ±20%) concentrate where there is no comparable.** With no other listing of the same model and year the rate is 19.2%; with 100+ comparables 2.8%. Top/sport segments (20.6%) and cars aged 18+ (11.6%) are risky too; overall 4.0%.

### Why a range, not a single number

An asking-price error costs money in both directions: **over-estimation hits the buyer** (a car bought too dear), **under-estimation hits the seller** (a car let go too cheap). A single number hides how sure the estimate is; a range states it and warns the user exactly where uncertainty is large.

That is why the output is a **90% range**, not one number. But the range does not hold on cheap cars: actual coverage in the cheapest quartile is **81.6%**, below target.

![Conformal coverage % (target 90%)](figures/en-12-coverage.png)

**What to do**

- Widen the range on cheap cars — don't trust a point estimate.
- Price rare and edge cars by hand; the model scatters there.
- Retrain monthly — the market level shifted (+5.3%) and the model is time-blind.

![OOF MAPE — per-snapshot vs cumulative](figures/en-15-backtest.png)

## What this model does not give you

- **The sale price.** It predicts the asking price; the haggling margin sits inside the target.
- **Causation.** These are controlled associations; it won't say "repaint it and the price drops".
- **The value of one specific damaged car.** "Damaged" spans a scratch to a rebuilt wreck, yet they all price into one low cluster the model can't tell apart.
- **Trim and modifications.** A loaded car looks the same to the model as a base one of the same specs.
- **Anything outside BMW and Audi.** Scope is these two brands; it generalises to the premium German segment, not the whole market.

**Scale:** 29,988 listings, 4 snapshots (2026-01-18 – 2026-06-27). Median asking price ₺1.54M.
