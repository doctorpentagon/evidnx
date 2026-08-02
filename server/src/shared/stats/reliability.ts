import { mean, variance } from "./descriptive.js";

export interface ReliabilityResult {
  cronbachAlpha: number;
  verdict: "poor" | "questionable" | "acceptable" | "good" | "excellent";
  itemStats: { item: string; correctedItemTotalCorrelation: number; alphaIfDeleted: number }[];
  nItems: number;
  n: number;
}

function classifyAlpha(alpha: number): ReliabilityResult["verdict"] {
  if (alpha < 0.5) return "poor";
  if (alpha < 0.6) return "questionable";
  if (alpha < 0.7) return "acceptable";
  if (alpha < 0.9) return "good";
  return "excellent";
}

function cronbachAlphaOf(itemMatrix: number[][]): number {
  const k = itemMatrix.length;
  const itemVariances = itemMatrix.map((item) => variance(item));
  const totalScores = itemMatrix[0].map((_, row) => itemMatrix.reduce((s, item) => s + item[row], 0));
  const totalVariance = variance(totalScores);
  const sumItemVariance = itemVariances.reduce((s, v) => s + v, 0);
  return (k / (k - 1)) * (1 - sumItemVariance / totalVariance);
}

/** Cronbach's alpha for a scale, plus item-total statistics per item. */
export function cronbachAlpha(items: { name: string; values: number[] }[]): ReliabilityResult {
  const itemMatrix = items.map((it) => it.values);
  const n = itemMatrix[0].length;
  const alpha = cronbachAlphaOf(itemMatrix);

  const totalScores = itemMatrix[0].map((_, row) => itemMatrix.reduce((s, item) => s + item[row], 0));

  const itemStats = items.map((item, i) => {
    const restTotal = totalScores.map((t, row) => t - itemMatrix[i][row]);
    const itemValues = item.values;
    const mi = mean(itemValues);
    const mr = mean(restTotal);
    let num = 0;
    let d1 = 0;
    let d2 = 0;
    for (let row = 0; row < n; row++) {
      const di = itemValues[row] - mi;
      const dr = restTotal[row] - mr;
      num += di * dr;
      d1 += di * di;
      d2 += dr * dr;
    }
    const correctedItemTotalCorrelation = num / Math.sqrt(d1 * d2);
    const alphaIfDeleted = cronbachAlphaOf(itemMatrix.filter((_, idx) => idx !== i));

    return { item: item.name, correctedItemTotalCorrelation, alphaIfDeleted };
  });

  return { cronbachAlpha: alpha, verdict: classifyAlpha(alpha), itemStats, nItems: items.length, n };
}
