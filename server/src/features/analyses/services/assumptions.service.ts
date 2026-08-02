import { andersonDarling, kolmogorovSmirnovLilliefors, shapiroWilk } from "../../../shared/stats/normality.js";
import { leveneTest } from "../../../shared/stats/levene.js";

export interface AssumptionCheck {
  name: string;
  verdict: "met" | "violated";
  detail: string;
  tests: { test: string; statistic: number; pValue: number; df?: number }[];
}

const ALPHA = 0.05;

/**
 * Runs the full normality battery per group (Shapiro-Wilk, KS-Lilliefors,
 * Anderson-Darling) and reduces it to a single plain pass/fail verdict -
 * the exact gap identified in the DataTab teardown (they show the four
 * tables but never simplify them into a verdict).
 */
export function checkNormality(groupLabel: string, values: number[]): AssumptionCheck {
  const sw = shapiroWilk(values);
  const ks = kolmogorovSmirnovLilliefors(values);
  const ad = andersonDarling(values);
  const met = sw.pValue > ALPHA;

  return {
    name: `Normality — ${groupLabel}`,
    verdict: met ? "met" : "violated",
    detail: met
      ? `${groupLabel}'s data is approximately normally distributed (Shapiro-Wilk p = ${sw.pValue.toFixed(3)}).`
      : `${groupLabel}'s data departs from a normal distribution (Shapiro-Wilk p = ${sw.pValue.toFixed(3)}) - consider the non-parametric alternative.`,
    tests: [
      { test: sw.test, statistic: sw.statistic, pValue: sw.pValue },
      { test: ks.test, statistic: ks.statistic, pValue: ks.pValue },
      { test: ad.test, statistic: ad.statistic, pValue: ad.pValue },
    ],
  };
}

export function checkEqualVariances(groups: number[][]): AssumptionCheck {
  const levene = leveneTest(groups, "mean");
  const brownForsythe = leveneTest(groups, "median");
  const met = levene.pValue > ALPHA;

  return {
    name: "Equal variances",
    verdict: met ? "met" : "violated",
    detail: met
      ? `Variances are equal across groups (Levene's test p = ${levene.pValue.toFixed(3)}).`
      : `Variances differ significantly across groups (Levene's test p = ${levene.pValue.toFixed(3)}) - consider Welch's correction or a non-parametric test.`,
    tests: [
      { test: levene.test, statistic: levene.statistic, pValue: levene.pValue, df: levene.df1 },
      { test: brownForsythe.test, statistic: brownForsythe.statistic, pValue: brownForsythe.pValue, df: brownForsythe.df1 },
    ],
  };
}

export function checkMulticollinearity(vifs: { name: string; vif: number | null }[]): AssumptionCheck {
  const concerning = vifs.filter((v) => v.vif !== null && v.vif > 5);
  const met = concerning.length === 0;
  return {
    name: "No multicollinearity",
    verdict: met ? "met" : "violated",
    detail: met
      ? "All predictors have acceptable VIF values (< 5) - no concerning overlap between predictors."
      : `${concerning.map((c) => c.name).join(", ")} ${concerning.length === 1 ? "has" : "have"} a VIF above 5, indicating predictors that overlap too much to interpret individually with confidence.`,
    tests: vifs.filter((v) => v.vif !== null).map((v) => ({ test: `VIF (${v.name})`, statistic: v.vif as number, pValue: NaN })),
  };
}
