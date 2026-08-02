import { describe, expect, it } from "vitest";
import { describe as summarize } from "../descriptive.js";
import { oneSampleTTest, independentTTest } from "../tTest.js";
import { oneWayAnova } from "../anova.js";
import { chiSquareTest } from "../chiSquare.js";
import { pearsonCorrelation, spearmanCorrelation } from "../correlation.js";

describe("golden statistical core", () => {
  it("matches textbook descriptive statistics", () => {
    const result = summarize([2, 4, 6, 8, 10]);
    expect(result.n).toBe(5);
    expect(result.mean).toBeCloseTo(6, 12);
    expect(result.median).toBeCloseTo(6, 12);
    expect(result.variance).toBeCloseTo(10, 12);
    expect(result.stdDev).toBeCloseTo(Math.sqrt(10), 12);
  });

  it("matches a known one-sample t statistic", () => {
    const result = oneSampleTTest([2, 4, 6, 8, 10], 5);
    expect(result.t).toBeCloseTo(Math.SQRT1_2, 10);
    expect(result.df).toBe(4);
    expect(result.pValue).toBeCloseTo(0.5185, 3);
  });

  it("returns both pooled and Welch estimates for independent samples", () => {
    const result = independentTTest([10, 11, 9, 10, 10], [20, 30, 10, 40, 50]);
    expect(result.equalVariance.df).toBe(8);
    expect(result.welch.df).toBeLessThan(result.equalVariance.df);
    expect(result.welch.test).toContain("Welch");
    expect(result.welch.pValue).toBeGreaterThanOrEqual(0);
    expect(result.welch.pValue).toBeLessThanOrEqual(1);
  });

  it("returns F=0 and p=1 for identical group means", () => {
    const result = oneWayAnova([
      { label: "A", values: [1, 2, 3] },
      { label: "B", values: [1, 2, 3] },
      { label: "C", values: [1, 2, 3] },
    ]);
    expect(result.F).toBeCloseTo(0, 12);
    expect(result.pValue).toBeCloseTo(1, 12);
  });

  it("returns chi-square=0 and p=1 for independent balanced categories", () => {
    const result = chiSquareTest(["A", "A", "B", "B"], ["X", "Y", "X", "Y"]);
    expect(result.statistic).toBeCloseTo(0, 12);
    expect(result.pValue).toBeCloseTo(1, 12);
    expect(result.cramersV).toBeCloseTo(0, 12);
  });

  it("detects perfect Pearson and Spearman relationships", () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8]).r).toBeCloseTo(1, 12);
    expect(spearmanCorrelation([1, 2, 3, 4], [40, 30, 20, 10]).r).toBeCloseTo(-1, 12);
  });
});
