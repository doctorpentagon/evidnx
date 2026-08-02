import jStat from "jstat";
import { mean, stdDev, variance } from "./descriptive.js";
import { classifyCohenD } from "./effectSize.js";

export interface TTestResult {
  test: string;
  t: number;
  df: number;
  pValue: number;
  meanDifference: number;
  cohenD: number;
  effectSizeLabel: string;
  ci95: [number, number];
}

function twoTailedP(t: number, df: number): number {
  return 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
}

export function oneSampleTTest(values: number[], testValue: number): TTestResult {
  const n = values.length;
  const m = mean(values);
  const s = stdDev(values);
  const se = s / Math.sqrt(n);
  const t = (m - testValue) / se;
  const df = n - 1;
  const d = (m - testValue) / s;
  const tCrit = jStat.studentt.inv(0.975, df);

  return {
    test: "One-Sample t-Test",
    t,
    df,
    pValue: twoTailedP(t, df),
    meanDifference: m - testValue,
    cohenD: d,
    effectSizeLabel: classifyCohenD(d),
    ci95: [m - tCrit * se, m + tCrit * se],
  };
}

export interface IndependentTTestResult {
  equalVariance: TTestResult;
  welch: TTestResult;
  group1: { n: number; mean: number; sd: number };
  group2: { n: number; mean: number; sd: number };
}

export function independentTTest(group1: number[], group2: number[]): IndependentTTestResult {
  const n1 = group1.length;
  const n2 = group2.length;
  const m1 = mean(group1);
  const m2 = mean(group2);
  const v1 = variance(group1);
  const v2 = variance(group2);
  const meanDiff = m1 - m2;

  // Pooled-variance (equal variances assumed)
  const pooledVar = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
  const sePooled = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
  const dfPooled = n1 + n2 - 2;
  const tPooled = meanDiff / sePooled;
  const tCritPooled = jStat.studentt.inv(0.975, dfPooled);

  // Welch's t-test (unequal variances assumed)
  const seWelch = Math.sqrt(v1 / n1 + v2 / n2);
  const tWelch = meanDiff / seWelch;
  const dfWelch = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const tCritWelch = jStat.studentt.inv(0.975, dfWelch);

  const pooledSd = Math.sqrt(pooledVar);
  const d = meanDiff / pooledSd;

  return {
    group1: { n: n1, mean: m1, sd: Math.sqrt(v1) },
    group2: { n: n2, mean: m2, sd: Math.sqrt(v2) },
    equalVariance: {
      test: "Independent Samples t-Test (Equal Variances Assumed)",
      t: tPooled,
      df: dfPooled,
      pValue: twoTailedP(tPooled, dfPooled),
      meanDifference: meanDiff,
      cohenD: d,
      effectSizeLabel: classifyCohenD(d),
      ci95: [meanDiff - tCritPooled * sePooled, meanDiff + tCritPooled * sePooled],
    },
    welch: {
      test: "Independent Samples t-Test (Welch's, Unequal Variances)",
      t: tWelch,
      df: dfWelch,
      pValue: twoTailedP(tWelch, dfWelch),
      meanDifference: meanDiff,
      cohenD: d,
      effectSizeLabel: classifyCohenD(d),
      ci95: [meanDiff - tCritWelch * seWelch, meanDiff + tCritWelch * seWelch],
    },
  };
}

export function pairedTTest(before: number[], after: number[]): TTestResult {
  if (before.length !== after.length) {
    throw new Error("Paired t-test requires equal-length samples.");
  }
  const diffs = before.map((b, i) => after[i] - b);
  return { ...oneSampleTTest(diffs, 0), test: "Paired Samples t-Test" };
}
