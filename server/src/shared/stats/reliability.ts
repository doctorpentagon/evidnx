import { mean, variance } from "./descriptive.js";

export interface ReliabilityResult {
  cronbachAlpha: number;
  standardizedAlpha: number;
  verdict: "poor" | "questionable" | "acceptable" | "good" | "excellent";
  itemStats: { item: string; correctedItemTotalCorrelation: number; alphaIfDeleted: number | null }[];
  nItems: number;
  n: number;
}

function classifyAlpha(alpha: number): ReliabilityResult["verdict"] {
  if (alpha < 0.6) return "poor";
  if (alpha < 0.7) return "questionable";
  if (alpha < 0.8) return "acceptable";
  if (alpha < 0.9) return "good";
  return "excellent";
}

function cronbachAlphaOf(itemMatrix: number[][]): number {
  const k = itemMatrix.length;
  if (k < 2 || itemMatrix[0].length < 2) return NaN;
  const itemVariances = itemMatrix.map((item) => variance(item));
  const totalScores = itemMatrix[0].map((_, row) => itemMatrix.reduce((s, item) => s + item[row], 0));
  const totalVariance = variance(totalScores);
  const sumItemVariance = itemVariances.reduce((s, v) => s + v, 0);
  return (k / (k - 1)) * (1 - sumItemVariance / totalVariance);
}

/** Cronbach's alpha for a scale, plus item-total statistics per item. */
export function cronbachAlpha(items: { name: string; values: number[] }[]): ReliabilityResult {
  if (items.length < 2) throw new Error("Cronbach's alpha requires at least two items.");
  const lengths = new Set(items.map((item) => item.values.length));
  if (lengths.size !== 1 || items[0].values.length < 3) throw new Error("Reliability analysis requires at least three complete responses per item.");
  const itemMatrix = items.map((it) => it.values);
  const n = itemMatrix[0].length;
  const alpha = cronbachAlphaOf(itemMatrix);

  let correlationSum = 0;
  let correlationPairs = 0;
  for (let i = 0; i < itemMatrix.length; i++) {
    for (let j = i + 1; j < itemMatrix.length; j++) {
      const leftMean = mean(itemMatrix[i]);
      const rightMean = mean(itemMatrix[j]);
      let numerator = 0;
      let leftSquares = 0;
      let rightSquares = 0;
      for (let row = 0; row < n; row++) {
        const left = itemMatrix[i][row] - leftMean;
        const right = itemMatrix[j][row] - rightMean;
        numerator += left * right;
        leftSquares += left * left;
        rightSquares += right * right;
      }
      correlationSum += numerator / Math.sqrt(leftSquares * rightSquares);
      correlationPairs++;
    }
  }
  const averageInterItemCorrelation = correlationSum / correlationPairs;
  const standardizedAlpha = (items.length * averageInterItemCorrelation) / (1 + (items.length - 1) * averageInterItemCorrelation);

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
    const deletedAlpha = cronbachAlphaOf(itemMatrix.filter((_, idx) => idx !== i));
    const alphaIfDeleted = Number.isFinite(deletedAlpha) ? deletedAlpha : null;

    return { item: item.name, correctedItemTotalCorrelation, alphaIfDeleted };
  });

  return { cronbachAlpha: alpha, standardizedAlpha, verdict: classifyAlpha(alpha), itemStats, nItems: items.length, n };
}
