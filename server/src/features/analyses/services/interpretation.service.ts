/**
 * Deterministic, template-based interpretation engine - no LLM call, no API
 * key, works fully offline. Generates the same two artifacts DataTab's
 * "AI Interpretation" + "Summary in words" produce, but built from the
 * analysis's own real computed numbers via string templates, and (unlike
 * DataTab) available for every analysis type, not inconsistently.
 */

export type Tone = "plain" | "academic" | "detailed" | "executive_summary";

export interface Interpretation {
  headline: string;
  columnExplanations: { label: string; explanation: string }[];
  narrative: Record<Tone, string>;
  followUpQuestions: string[];
}

function sig(p: number): { isSignificant: boolean; word: string; pText: string } {
  const isSignificant = p < 0.05;
  const pText = p < 0.001 ? "p < .001" : `p = ${p.toFixed(3).replace(/^0/, "")}`;
  return { isSignificant, word: isSignificant ? "a statistically significant" : "no statistically significant", pText };
}

function wrapTones(base: string, academic: string, detailed: string, executive: string): Record<Tone, string> {
  return { plain: base, academic, detailed, executive_summary: executive };
}

export function interpretIndependentTTest(params: {
  outcomeVar: string;
  groupVar: string;
  group1: { label: string; n: number; mean: number };
  group2: { label: string; n: number; mean: number };
  t: number;
  df: number;
  pValue: number;
  cohenD: number;
  effectSizeLabel: string;
}): Interpretation {
  const { isSignificant, pText } = sig(params.pValue);
  const higher = params.group1.mean > params.group2.mean ? params.group1 : params.group2;
  const lower = params.group1.mean > params.group2.mean ? params.group2 : params.group1;

  const base = isSignificant
    ? `${higher.label} scored higher on ${params.outcomeVar} than ${lower.label} (${higher.mean.toFixed(2)} vs. ${lower.mean.toFixed(2)}), and this difference is unlikely to be due to chance (${pText}).`
    : `There was no meaningful difference in ${params.outcomeVar} between ${params.group1.label} (${params.group1.mean.toFixed(2)}) and ${params.group2.label} (${params.group2.mean.toFixed(2)}) - the observed gap could plausibly be due to chance (${pText}).`;

  const academic = `An independent-samples t-test was conducted to compare ${params.outcomeVar} between ${params.group1.label} and ${params.group2.label}. There was ${sig(params.pValue).word} difference in scores for ${params.group1.label} (M = ${params.group1.mean.toFixed(2)}, n = ${params.group1.n}) and ${params.group2.label} (M = ${params.group2.mean.toFixed(2)}, n = ${params.group2.n}); t(${params.df.toFixed(1)}) = ${params.t.toFixed(2)}, ${pText}, d = ${params.cohenD.toFixed(2)} (${params.effectSizeLabel} effect).`;

  const detailed = `${academic} The effect size (Cohen's d = ${params.cohenD.toFixed(2)}) falls in the ${params.effectSizeLabel} range by Cohen's (1988) benchmarks, meaning the practical size of the difference is ${params.effectSizeLabel === "negligible" ? "small enough that it may not be practically meaningful even though the statistical test result is as reported" : "worth attention beyond just the p-value"}.`;

  const executive = isSignificant
    ? `${higher.label} outperforms ${lower.label} on ${params.outcomeVar} by a ${params.effectSizeLabel} margin (${pText}).`
    : `No reliable difference found between groups on ${params.outcomeVar} (${pText}).`;

  return {
    headline: base,
    columnExplanations: [
      { label: "t-statistic", explanation: `Measures how many standard errors apart the two group means are; larger magnitude means a bigger, more reliable difference.` },
      { label: "df (degrees of freedom)", explanation: `Reflects the total sample size available to estimate the difference (${params.df.toFixed(1)} here).` },
      { label: "p-value", explanation: `The probability of seeing a difference this large if there were truly no difference in the population; below .05 is conventionally "significant."` },
      { label: "Cohen's d", explanation: `The size of the difference in standard-deviation units, independent of sample size - ${params.effectSizeLabel} here.` },
    ],
    narrative: wrapTones(base, academic, detailed, executive),
    followUpQuestions: [`Why is ${higher.label} higher?`, `Show me a chart for this`, `Is this result strong enough to report?`],
  };
}

export function interpretAnova(params: {
  outcomeVar: string;
  groupVar: string;
  F: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  etaSquared: number;
  etaSquaredLabel: string;
  groups: { label: string; mean: number }[];
}): Interpretation {
  const { isSignificant, pText } = sig(params.pValue);
  const sorted = [...params.groups].sort((a, b) => b.mean - a.mean);
  const base = isSignificant
    ? `${params.groupVar} has ${sig(params.pValue).word} effect on ${params.outcomeVar} (${pText}). ${sorted[0].label} has the highest average (${sorted[0].mean.toFixed(2)}), and ${sorted[sorted.length - 1].label} the lowest (${sorted[sorted.length - 1].mean.toFixed(2)}).`
    : `${params.groupVar} does not have a statistically significant effect on ${params.outcomeVar} (${pText}) - the group averages are similar enough to be explained by chance.`;

  const academic = `A one-way ANOVA was conducted to compare the effect of ${params.groupVar} on ${params.outcomeVar}. There was ${sig(params.pValue).word} effect, F(${params.dfBetween}, ${params.dfWithin}) = ${params.F.toFixed(2)}, ${pText}, η² = ${params.etaSquared.toFixed(3)} (${params.etaSquaredLabel} effect).`;

  const detailed = `${academic} ${isSignificant ? "Because the omnibus test is significant, post-hoc pairwise comparisons (Bonferroni and Scheffé) should be consulted to determine exactly which groups differ from each other." : "Since the omnibus test is not significant, post-hoc pairwise comparisons are not warranted."}`;

  const executive = isSignificant
    ? `${params.groupVar} meaningfully affects ${params.outcomeVar} (${params.etaSquaredLabel} effect, ${pText}). Top group: ${sorted[0].label}.`
    : `${params.groupVar} shows no meaningful effect on ${params.outcomeVar} (${pText}).`;

  return {
    headline: base,
    columnExplanations: [
      { label: "F statistic", explanation: "The ratio of variation between groups to variation within groups; larger means the groups differ more than expected by chance." },
      { label: "p-value", explanation: `Below .05 means the group differences are unlikely to be random noise.` },
      { label: "η² (eta squared)", explanation: `The proportion of variance in ${params.outcomeVar} explained by ${params.groupVar} - ${params.etaSquaredLabel} here.` },
    ],
    narrative: wrapTones(base, academic, detailed, executive),
    followUpQuestions: [`Which groups differ from each other?`, `Show me a chart for this`, `Explain ANOVA to me`],
  };
}

export function interpretChiSquare(params: {
  rowVar: string;
  colVar: string;
  statistic: number;
  df: number;
  pValue: number;
  cramersV: number;
}): Interpretation {
  const { isSignificant, pText } = sig(params.pValue);
  const strength = params.cramersV < 0.1 ? "negligible" : params.cramersV < 0.3 ? "weak" : params.cramersV < 0.5 ? "moderate" : "strong";

  const base = isSignificant
    ? `There is ${sig(params.pValue).word} association between ${params.rowVar} and ${params.colVar} (${pText}), with a ${strength} strength of association.`
    : `${params.rowVar} and ${params.colVar} appear to be independent - no significant association was found (${pText}).`;

  const academic = `A chi-square test of independence was performed to examine the relationship between ${params.rowVar} and ${params.colVar}. The relationship was ${isSignificant ? "significant" : "not significant"}, χ²(${params.df}) = ${params.statistic.toFixed(2)}, ${pText}, Cramér's V = ${params.cramersV.toFixed(2)} (${strength} association).`;

  const detailed = `${academic} Cramér's V ranges from 0 (no association) to 1 (perfect association); a value of ${params.cramersV.toFixed(2)} indicates the relationship, while ${isSignificant ? "statistically detectable, " : ""}is ${strength} in practical terms.`;

  const executive = isSignificant
    ? `${params.rowVar} and ${params.colVar} are related (${strength} association, ${pText}).`
    : `No relationship detected between ${params.rowVar} and ${params.colVar} (${pText}).`;

  return {
    headline: base,
    columnExplanations: [
      { label: "χ² statistic", explanation: "How far the observed category counts are from what you'd expect if the two variables were unrelated." },
      { label: "p-value", explanation: "Below .05 means the association is unlikely to be due to chance." },
      { label: "Cramér's V", explanation: `Effect size for chi-square, 0 to 1 - ${strength} here.` },
    ],
    narrative: wrapTones(base, academic, detailed, executive),
    followUpQuestions: [`Show me the crosstab`, `Which categories drive this?`, `Show me a chart for this`],
  };
}

export function interpretCorrelation(params: {
  varX: string;
  varY: string;
  r: number;
  pValue: number;
  method: string;
  effectSizeLabel: string;
}): Interpretation {
  const { isSignificant, pText } = sig(params.pValue);
  const direction = params.r > 0 ? "positive" : "negative";

  const base = isSignificant
    ? `There is a ${params.effectSizeLabel} ${direction} relationship between ${params.varX} and ${params.varY} (r = ${params.r.toFixed(2)}, ${pText}) - as one increases, the other tends to ${params.r > 0 ? "increase" : "decrease"}.`
    : `No significant relationship was found between ${params.varX} and ${params.varY} (r = ${params.r.toFixed(2)}, ${pText}).`;

  const academic = `A ${params.method} correlation was computed to assess the relationship between ${params.varX} and ${params.varY}. There was ${sig(params.pValue).word} ${direction} correlation, r = ${params.r.toFixed(2)}, ${pText}.`;

  const detailed = `${academic} By Cohen's (1988) benchmarks this is a ${params.effectSizeLabel} effect, meaning ${(params.r ** 2 * 100).toFixed(0)}% of the variance in ${params.varY} is associated with ${params.varX} (r²= ${(params.r ** 2).toFixed(2)}).`;

  const executive = isSignificant
    ? `${params.varX} and ${params.varY} move together (${params.effectSizeLabel}, ${direction}, ${pText}).`
    : `${params.varX} and ${params.varY} are not meaningfully related (${pText}).`;

  return {
    headline: base,
    columnExplanations: [
      { label: "r (correlation coefficient)", explanation: "Ranges from -1 to 1; the sign shows direction and the magnitude shows strength." },
      { label: "p-value", explanation: "Below .05 means the relationship is unlikely to be due to chance." },
    ],
    narrative: wrapTones(base, academic, detailed, executive),
    followUpQuestions: [`Show me a scatter plot`, `Could this be driven by a third variable?`, `Is this strong enough to report?`],
  };
}

export function interpretRegression(params: {
  dvName: string;
  r2: number;
  adjR2: number;
  F: number;
  dfModel: number;
  dfResidual: number;
  pValue: number;
  coefficients: { name: string; estimate: number; pValue: number }[];
}): Interpretation {
  const { isSignificant, pText } = sig(params.pValue);
  const predictors = params.coefficients.filter((c) => c.name !== "Intercept");
  const significantPredictors = predictors.filter((c) => c.pValue < 0.05);

  const base = isSignificant
    ? `This model explains ${(params.r2 * 100).toFixed(0)}% of the variation in ${params.dvName} (R² = ${params.r2.toFixed(2)}, ${pText}). ${significantPredictors.length > 0 ? `The strongest predictor${significantPredictors.length > 1 ? "s are" : " is"} ${significantPredictors.map((p) => p.name).join(", ")}.` : "None of the individual predictors reach significance on their own, though the overall model does."}`
    : `This model does not significantly predict ${params.dvName} (R² = ${params.r2.toFixed(2)}, ${pText}).`;

  const academic = `A linear regression was conducted to predict ${params.dvName} from ${predictors.map((p) => p.name).join(", ")}. The overall model was ${isSignificant ? "significant" : "not significant"}, F(${params.dfModel}, ${params.dfResidual}) = ${params.F.toFixed(2)}, ${pText}, R² = ${params.r2.toFixed(2)}, adjusted R² = ${params.adjR2.toFixed(2)}.`;

  const detailed = `${academic} ${predictors.map((p) => `${p.name} (β = ${p.estimate.toFixed(2)}, p ${p.pValue < 0.001 ? "< .001" : `= ${p.pValue.toFixed(3)}`})`).join("; ")}.`;

  const executive = `Model explains ${(params.r2 * 100).toFixed(0)}% of variance in ${params.dvName}${isSignificant ? "" : " (not statistically reliable)"}.`;

  return {
    headline: base,
    columnExplanations: [
      { label: "R²", explanation: "The percentage of variation in the outcome explained by all predictors together." },
      { label: "F statistic / model p-value", explanation: "Whether the model as a whole predicts significantly better than just guessing the average." },
      { label: "Coefficient (β)", explanation: "How much the outcome changes for a one-unit increase in that predictor, holding others constant." },
      { label: "VIF", explanation: "Checks whether predictors overlap too much with each other; above 5 suggests a multicollinearity concern." },
    ],
    narrative: wrapTones(base, academic, detailed, executive),
    followUpQuestions: [`Which predictor matters most?`, `Show me the residual plot`, `Is multicollinearity a concern?`],
  };
}

export function interpretReliability(params: { scaleName: string; alpha: number; verdict: string; nItems: number }): Interpretation {
  const base = `The ${params.scaleName} scale (${params.nItems} items) has ${params.verdict} internal consistency (Cronbach's α = ${params.alpha.toFixed(2)}).`;
  const academic = `Internal consistency reliability for the ${params.scaleName} scale was ${params.verdict}, α = ${params.alpha.toFixed(2)}.`;
  const detailed = `${academic} By convention, α ≥ .9 is excellent, ≥ .8 good, ≥ .7 acceptable, ≥ .6 questionable, and below .5 poor - this scale's items ${params.alpha >= 0.7 ? "hang together well enough to be treated as measuring a single underlying construct." : "may need revision; check the item-total statistics for any item dragging the scale down."}`;
  const executive = `Scale reliability: ${params.verdict} (α = ${params.alpha.toFixed(2)}).`;

  return {
    headline: base,
    columnExplanations: [
      { label: "Cronbach's alpha", explanation: "How consistently the items in this scale measure the same underlying concept, from 0 to 1." },
      { label: "Corrected item-total correlation", explanation: "How well each individual item correlates with the rest of the scale; low or negative values flag a problem item." },
      { label: "Alpha if item deleted", explanation: "Whether removing that item would improve overall reliability." },
    ],
    narrative: wrapTones(base, academic, detailed, executive),
    followUpQuestions: [`Which item should I consider dropping?`, `Explain Cronbach's alpha to me`],
  };
}

export function genericInterpretation(title: string, keyFacts: string[]): Interpretation {
  const base = keyFacts.join(" ");
  return {
    headline: base,
    columnExplanations: [],
    narrative: wrapTones(base, base, base, keyFacts[0] ?? base),
    followUpQuestions: [`Explain ${title} to me`, `Show me a chart for this`],
  };
}
