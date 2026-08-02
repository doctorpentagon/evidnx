import { leveneTest } from "./levene.js";
import { shapiroWilk } from "./normality.js";

export interface RuledOutAlternative {
  test: string;
  reason: string;
}

export interface TestRecommendation {
  recommendedTest: string;
  variant?: "pooled" | "welch";
  parametric: boolean;
  reasoning: string;
  alternativesRuledOut: RuledOutAlternative[];
  normalityByGroup: { group: string; pValue: number; normal: boolean }[];
  leveneP: number | null;
  equalVariances: boolean | null;
}

const NORMALITY_ALPHA = 0.05;

/**
 * Recommends the correct hypothesis test given a grouping (nominal/ordinal)
 * variable and a numeric outcome, by actually running the assumption checks
 * rather than guessing - mirrors DataTab's routing mechanic, but the
 * plain-language "why" is returned alongside it (DataTab never explains
 * the routing logic to the user in the tool itself, only in a static tooltip).
 */
export function recommendGroupComparisonTest(
  groups: { label: string; values: number[] }[],
  options: { paired?: boolean } = {},
): TestRecommendation {
  const normalityByGroup = groups.map((g) => {
    const { pValue } = shapiroWilk(g.values);
    return { group: g.label, pValue, normal: pValue > NORMALITY_ALPHA };
  });
  const allNormal = normalityByGroup.every((g) => g.normal);

  let leveneP: number | null = null;
  let equalVariances: boolean | null = null;
  if (groups.length >= 2 && !options.paired) {
    const levene = leveneTest(groups.map((g) => g.values));
    leveneP = levene.pValue;
    equalVariances = levene.pValue > NORMALITY_ALPHA;
  }

  const k = groups.length;
  const alternativesRuledOut: RuledOutAlternative[] = [];

  if (options.paired) {
    if (allNormal) {
      alternativesRuledOut.push({ test: "Wilcoxon Signed-Rank Test", reason: "Differences are approximately normally distributed, so the more powerful parametric test is preferred." });
      return {
        recommendedTest: "paired_t_test",
        parametric: true,
        reasoning: "Both conditions are normally distributed (Shapiro-Wilk p > .05), so a paired t-test is appropriate for these repeated measurements.",
        alternativesRuledOut,
        normalityByGroup,
        leveneP,
        equalVariances,
      };
    }
    alternativesRuledOut.push({ test: "Paired t-Test", reason: "At least one condition violates normality (Shapiro-Wilk p < .05), so the parametric assumption is not met." });
    return {
      recommendedTest: "wilcoxon",
      parametric: false,
      reasoning: "One or both conditions depart from a normal distribution, so the non-parametric Wilcoxon signed-rank test is safer than a paired t-test here.",
      alternativesRuledOut,
      normalityByGroup,
      leveneP,
      equalVariances,
    };
  }

  if (k === 2) {
    if (allNormal && equalVariances) {
      alternativesRuledOut.push({ test: "Mann-Whitney U Test", reason: "Both groups are approximately normal with equal variances, so the parametric test has more statistical power." });
      return {
        recommendedTest: "independent_t_test",
        variant: "pooled",
        parametric: true,
        reasoning: "Both groups pass the normality check and Levene's test shows equal variances, so an independent-samples t-test is the right fit.",
        alternativesRuledOut,
        normalityByGroup,
        leveneP,
        equalVariances,
      };
    }
    if (allNormal && equalVariances === false) {
      alternativesRuledOut.push({
        test: "Pooled independent-samples t-test",
        reason: "Levene's test indicates unequal variances, so Welch's variance correction is required.",
      });
      alternativesRuledOut.push({
        test: "Mann-Whitney U Test",
        reason: "Unequal variances alone do not change the scientific question to a rank/distribution comparison; normality is still acceptable.",
      });
      return {
        recommendedTest: "independent_t_test",
        variant: "welch",
        parametric: true,
        reasoning: "Both groups are approximately normal, but their variances differ, so Welch's independent-samples t-test is safer than the pooled-variance version.",
        alternativesRuledOut,
        normalityByGroup,
        leveneP,
        equalVariances,
      };
    }

    alternativesRuledOut.push({
      test: "Independent-Samples t-Test",
      reason: "At least one group departs from a normal distribution (Shapiro-Wilk p < .05).",
    });
    return {
      recommendedTest: "mann_whitney",
      parametric: false,
      reasoning: "At least one group is not normally distributed, so the non-parametric Mann-Whitney U test is the safer choice for an ordinal/distribution comparison.",
      alternativesRuledOut,
      normalityByGroup,
      leveneP,
      equalVariances,
    };
  }

  // k >= 3
  if (allNormal && equalVariances) {
    alternativesRuledOut.push({ test: "Kruskal-Wallis Test", reason: "All groups are approximately normal with equal variances, so ANOVA has more statistical power." });
    return {
      recommendedTest: "one_way_anova",
      parametric: true,
      reasoning: "All groups pass the normality check and Levene's test shows equal variances, so a one-way ANOVA is appropriate.",
      alternativesRuledOut,
      normalityByGroup,
      leveneP,
      equalVariances,
    };
  }
  alternativesRuledOut.push({
    test: "One-Way ANOVA",
    reason: allNormal ? "Variances differ significantly between groups (Levene's test p < .05)." : "At least one group departs from a normal distribution (Shapiro-Wilk p < .05).",
  });
  return {
    recommendedTest: "kruskal_wallis",
    parametric: false,
    reasoning: allNormal
      ? "Groups are normal but variances differ, so Kruskal-Wallis avoids the equal-variance assumption."
      : "At least one group is not normally distributed, so the non-parametric Kruskal-Wallis test is the safer choice.",
    alternativesRuledOut,
    normalityByGroup,
    leveneP,
    equalVariances,
  };
}
