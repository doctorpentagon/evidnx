import jStat from "jstat";
import { mean, median } from "./descriptive.js";

export interface LeveneResult {
  test: string;
  statistic: number;
  df1: number;
  df2: number;
  pValue: number;
}

/**
 * Levene's test of equal variances. `center` selects the classic mean-based
 * Levene test or the more robust Brown-Forsythe variant (median-centered) -
 * DataTab and most stats software report both side by side.
 */
export function leveneTest(groups: number[][], center: "mean" | "median" = "mean"): LeveneResult {
  const k = groups.length;
  const centerFn = center === "mean" ? mean : median;
  const zGroups = groups.map((g) => {
    const c = centerFn(g);
    return g.map((v) => Math.abs(v - c));
  });

  const N = zGroups.reduce((s, g) => s + g.length, 0);
  const grandMean = mean(zGroups.flat());

  const zGroupMeans = zGroups.map((g) => mean(g));
  const ssBetween = zGroups.reduce((s, g, i) => s + g.length * (zGroupMeans[i] - grandMean) ** 2, 0);
  const ssWithin = zGroups.reduce((s, g, i) => s + g.reduce((acc, v) => acc + (v - zGroupMeans[i]) ** 2, 0), 0);

  const df1 = k - 1;
  const df2 = N - k;
  const msBetween = ssBetween / df1;
  const msWithin = ssWithin / df2;
  const W = msBetween / msWithin;
  const pValue = 1 - jStat.centralF.cdf(W, df1, df2);

  return {
    test: center === "mean" ? "Levene's Test (Mean)" : "Brown-Forsythe Test (Median)",
    statistic: W,
    df1,
    df2,
    pValue: Math.min(1, Math.max(0, pValue)),
  };
}
