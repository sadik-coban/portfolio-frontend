# Used Car Market Analysis — Decision Note

**For:** the pricing team and the dealership. **Decision:** the model can serve as the primary reference in a price-suggestion tool, but not on its own for cheap (below ₺1.15M), comparable-less or 18+ year-old cars. **Gain:** about ₺81K less pricing error per car. **Limit:** it predicts the asking price, not the sale price.

## What's it worth?

**The comparable median** — *the middle price of the same model and year* — misses by **₺191K** on average; the model by **₺110K** — **42% better**, **₺81K** per car. Across a 100-car stock that is about **₺8M** of pricing error.

The gap it closes is everything beyond model and year: mileage, damage, engine.

![Mean error: comparable median vs model](figures/en-00-base-vs-model.png)

**Without a comparable the baseline collapses** — mean error at the bottom tier is **6.1×** the top. The model struggles without comparables too (below):

| baseline tier | listings | share | mean error |
|---|---:|---:|---:|
| model + year | 29,236 | 97.49% | ₺179K |
| model | 596 | 1.99% | ₺559K |
| global | 156 | 0.52% | ₺1.10M |

## How this market builds a price

How much each driver moves the price — **with everything else held fixed**:

| driver | price |
|---|---:|
| age (per year) | -7.1% |
| mileage (per 100k km) | -14.6% |
| heavy-damage record | -11.4% |
| changed panel (each) | -3.1% |
| painted panel (each) | -1.1% |
| +100 hp of engine power | +21.3% |

Age and mileage are separate but linked axes. A low-km old car is where they diverge: it paid the age penalty but not the mileage one, so it stays systematically underpriced.

![Price by age (median + mean)](figures/en-05-age-price.png)

![Price by mileage (median + mean)](figures/en-06-km-price.png)

**Brand gives you nothing to act on.** Adding brand on top of series+model does not move the mean error — brand already lives inside model.

![Median price: BMW vs Audi](figures/en-07-brand.png)

## Where not to trust the number

The model struggles on cheap cars — error varies sharply by price quartile.

![Median error by price quartile (%)](figures/en-10-quartile-error.png)

**Large misses (beyond ±20%) concentrate where there is no comparable.** With no other listing of the same model and year the rate is 19.2%; with 100+ comparables 2.8%. Top/sport segments (20.6%) and cars aged 18+ (11.6%) are risky too; overall 4.0%.

### Why a range, not a single number

An asking-price error costs money in both directions: **over-estimating hits the buyer** — they overpay; **under-estimating hits the seller** — the car goes too cheap. A single number hides how sure the estimate is; a range states it and warns the user exactly where uncertainty is large.

That is why the output is a **90% range**, not one number. But the range does not hold on cheap cars: actual coverage in the cheapest quartile is **81.6%**, below target.

![How often the 90% range held (target 90%)](figures/en-12-coverage.png)

**What to do**

- Widen the range on cheap cars — don't trust a point estimate.
- Price rare and edge cars by hand; the model scatters there.
- Never auto-price a listing whose text mentions a conversion, an engine swap or modifications — price it by hand; that information is not in the form and it is the biggest source of error.
- Retrain monthly — the market level shifted (+5.3%) and the model is time-blind.

![More data, less error — single period vs pooled periods](figures/en-15-backtest.png)

## What this model does not give you

- **The sale price.** It predicts the asking price; the sale price lands below it after haggling.
- **Causation.** These are controlled associations; it won't say "repaint it and the price drops".
- **The value of one specific damaged car.** The model sees damage panel by panel (painted · changed · heavy-damage record) but not its **severity**: a scratch and a write-off land on the same flag.
- **Trim and modifications.** A loaded car looks the same to the model as a base one of the same specs.
- **Anything outside BMW and Audi.** Scope is these two brands; it generalises to the premium German segment, not the whole market.

**Scale:** 29,988 listings, 4 scrape snapshots. **Data:** 2026-01-18 – 2026-06-27. Median asking price ₺1.54M.
