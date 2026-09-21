# Used Car Market Analysis — SHAP Report

**What does the model look at** when it builds a price? The model explained here is LightGBM — the one called "the model" in the technical report. CatBoost's two variants appear only in the §4 comparison. It works at the level of the whole dataset: which feature takes what share, and how its effect changes across the range.

## 1. What SHAP is, and how it differs from LOFO

**SHAP** splits a single prediction into parts: on this listing age pushed the price up this much, mileage pulled it down that much; the parts add up to the prediction exactly. The **ablation/LOFO** (leave-one-feature-out) in the technical report asks how much the *error* grows when a feature is removed.

## 2. How it was computed

- **Data:** **all** 29,988 listings — no sampling.
- **Model: OOF.** Every listing is explained by the fold model that never saw it in training (5-fold, the producer's exact setup). The reconstructed predictions match the published ones down to the lira.
- **Method:** `shap.TreeExplainer` (exact). Additivity error 6.6e-13, so the parts reconstruct the prediction exactly.
- **Scale:** target `log1p(price)`, so contributions add in log and **multiply** on price (see the table below).
- **Grouping:** the 170 SVD dimensions of the model/series name mean nothing individually, so they are summed into `MODEL_SERIES`. In the §3 table `ENGINE` = hp + cc and `DAMAGE` = 13 panels + heavy damage; in the beeswarm and cohort charts they appear as separate rows.

### Which scale in which chart

Each chart uses the scale that is **most meaningful to the reader**:

| scale | where | why |
|---|---|---|
| **log** | beeswarm, cohorts, interaction | The **only** scale comparable across listings: `+0.62` means the same thing on a cheap and an expensive car. |
| **%** | dependence curves, the last column of the §3 table | Turns a contribution into a multiplier: `e^s − 1`. +0.10 → ×1.105, i.e. 10.5% more expensive; −0.10 → ×0.905, 9.5% cheaper. |

**Worked example.** The mean |SHAP| of Age (years) is 0.2872 → `e^0.2872 = 1.333`, so on a typical listing it moves the price by 33.3%. If Engine (hp + cc) adds 0.1360 on the same listing the percentages do not add — the multipliers multiply: `1.333 × 1.146 = 1.527` → 52.7%, not 33.3% + 14.6% = 47.8%.

## 3. What sets the price

![What drives price](figures/en-sh-01-importance.png)

| feature | mean \|SHAP\| | share | on price |
|---|---:|---:|---:|
| Age (years) | 0.2872 | 43.6% | 33.3% |
| Engine (hp + cc) | 0.1360 | 20.7% | 14.6% |
| Mileage | 0.0839 | 12.8% | 8.8% |
| Model/series name | 0.0709 | 10.8% | 7.3% |
| Damage (13 panels) | 0.0413 | 6.3% | 4.2% |
| Segment | 0.0264 | 4.0% | 2.7% |
| Body type | 0.0071 | 1.1% | 0.7% |
| Transmission | 0.0043 | 0.7% | 0.4% |
| Fuel | 0.0009 | 0.1% | 0.1% |
| Drivetrain | 0.0001 | 0.0% | 0.0% |
| Brand | 0.0001 | 0.0% | 0.0% |

*These shares are specific to LightGBM (§4).*

**Age (years)** alone takes 43.6% of the attribution, the top three 77.1%.

### Direction check

![Each dot is a listing](figures/en-sh-02-beeswarm.png)

Direction of effect (Spearman rank correlation): age **-0.99**, mileage **-0.96**, engine power **+0.89**. More age and mileage push the price down, more power pushes it up. This is a sanity check; an inverted sign would mean the data or the model is broken.

![The effect is not linear](figures/en-sh-03-dependence.png)

The three curves show three different behaviours:

- **Age falls almost linearly:** median contribution +0.64 at 0–2 years and -0.63 at 18+, a **3.6×** price difference end to end. The model's strongest rule.
- **What mileage costs** (difference between consecutive band medians, scaled to 100k km because the bands are not equally wide): 8.5% between 25k and 125k km, 10.9% between 125k and 225k, 5.9% between 225k and 425k. The last band is much lower: beyond that point extra mileage barely moves the price — and that region holds only 1,723 listings.
- **Engine power has a threshold:** median contribution moves -0.16 → +0.36 from sub-150 hp to 250+ hp (**1.7×**). The jump is narrow and the curve flattens after it; power may work as a marker of higher trim.

### The model does not look at the same thing on every car

![Two cohorts](figures/en-sh-04-cohorts.png)

We did not pick the split: shap's own decision tree cut the data at **Age (years) = 9.5**. The mean |SHAP| of *Age (years)* is 0.40 in one group and 0.23 in the other, about 1.7× more weight on young cars. The §3 ranking is an **average**: on a new car age sets the price, on an old one the other features take over.

### Age and mileage act together

![Same mileage, different age](figures/en-sh-05-km-age.png)

Colour is the car's age. In the same **150–250k km** band the median mileage contribution is -0.03 under 10 years (2,232 listings) and -0.01 above (9,000 listings): the model charges less for mileage on an old car, having already charged it for age. The two features are not independent (§7).

## 4. Three variants build the same price for different reasons

| feature | LightGBM | CatBoost (SVD) | CatBoost (native) |
|---|---:|---:|---:|
| Age (years) | 43.6% | 30.8% | 32.2% |
| Engine (hp + cc) | 20.7% | 17.2% | 17.2% |
| Mileage | 12.8% | 22.1% | 22.9% |
| Model/series name | 10.8% | 14.0% | 18.5% |
| Damage (13 panels) | 6.3% | 7.5% | 6.4% |
| Segment | 4.0% | 6.8% | 0.2% |
| Body type | 1.1% | 0.4% | 1.1% |
| Transmission | 0.7% | 0.9% | 0.1% |
| Fuel | 0.1% | 0.1% | 0.0% |
| Drivetrain | 0.0% | 0.2% | 0.2% |
| Brand | 0.0% | 0.0% | 1.2% |

The technical report calls the three variants practically tied on accuracy. They are not tied on reasoning: LightGBM gives age 43.6%, CatBoost 30.8% (12.8 points apart), and on mileage it reverses (12.8% · 22.1%). Age and mileage move together, so which one gets the credit is the model's preference. **Takeaway:** "age is the most important feature" is model-dependent; "age + mileage + engine together set the price" holds across all three.

## 5. Why brand is next to nothing

`brand` has mean |SHAP| **0.0001**, 0.00% of the attribution. The model barely uses brand because the model name already determines it (technical report §3: U(brand | model) = 1.00).

Three methods — dependence, ablation, SHAP — land in the same place: **brand carries no separate information.** That is not "brand does not affect price"; its effect sits inside the model name.

## 6. How one prediction is built

![316i M Sport](figures/en-sh-06-waterfall.png)

On the left `E[f(x)]` is what the model predicts before it sees any feature, on the right `f(x)` is its prediction for this listing; each arrow between them is one feature's contribution (log scale, §2).

- **Listing:** 316i M Sport · 2014 · 171,000 km
- **Actual price:** ₺1,495,000
- **Model's prediction** (it never saw this listing)**:** ₺1,419,715 (-5.0%)

The three biggest contributions:

1. Engine power (hp) = 136 hp → ×0.89
2. Age (years) = 12 yr → ×0.94
3. Model/series name = 316i M Sport → ×0.97

Smaller items such as mileage barely move the total; a few large arrows do the work.

No bar accounts for the 5.0% gap: SHAP decomposes the **prediction**, not the actual price. What the model does not know is not written in the breakdown.

## 7. Limitations

- **Attribution, not causation.** SHAP says what the model used, not how the market works.
- **Features that move together share the credit.** How age and mileage split it depends on the model (§4). TreeSHAP runs here in `tree_path_dependent` mode, i.e. observational, which also shapes the split.
- **Contributions live in log space.** When comparing items, read the **multipliers**: they mean the same thing on every listing. Converting to lira is listing-specific and order-dependent, so this report does not do it.
- **The grouping is a decision.** `MODEL_SERIES` is the sum of 170 SVD dimensions; taken one by one each looks negligible and the joint effect disappears.
