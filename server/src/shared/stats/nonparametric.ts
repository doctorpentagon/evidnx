import jStat from "jstat";

function rankAll(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length).fill(0);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
    i = j + 1;
  }
  return ranks;
}

export interface MannWhitneyResult {
  test: string;
  U: number;
  z: number;
  pValue: number;
  group1: { n: number; meanRank: number; sumRank: number };
  group2: { n: number; meanRank: number; sumRank: number };
}

export function mannWhitneyU(group1: number[], group2: number[]): MannWhitneyResult {
  const n1 = group1.length;
  const n2 = group2.length;
  const combined = [...group1, ...group2];
  const ranks = rankAll(combined);

  const sumRank1 = ranks.slice(0, n1).reduce((s, r) => s + r, 0);
  const sumRank2 = ranks.slice(n1).reduce((s, r) => s + r, 0);

  const U1 = sumRank1 - (n1 * (n1 + 1)) / 2;
  const U2 = sumRank2 - (n2 * (n2 + 1)) / 2;
  const U = Math.min(U1, U2);

  const meanU = (n1 * n2) / 2;
  const sdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = (U - meanU) / sdU;
  const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));

  return {
    test: "Mann-Whitney U Test",
    U,
    z,
    pValue: Math.min(1, Math.max(0, pValue)),
    group1: { n: n1, meanRank: sumRank1 / n1, sumRank: sumRank1 },
    group2: { n: n2, meanRank: sumRank2 / n2, sumRank: sumRank2 },
  };
}

export interface WilcoxonResult {
  test: string;
  W: number;
  z: number;
  pValue: number;
  n: number;
}

export function wilcoxonSignedRank(before: number[], after: number[]): WilcoxonResult {
  const diffs = before.map((b, i) => after[i] - b).filter((d) => d !== 0);
  const n = diffs.length;
  const absDiffs = diffs.map(Math.abs);
  const ranks = rankAll(absDiffs);

  let wPlus = 0;
  let wMinus = 0;
  diffs.forEach((d, i) => {
    if (d > 0) wPlus += ranks[i];
    else wMinus += ranks[i];
  });
  const W = Math.min(wPlus, wMinus);

  const meanW = (n * (n + 1)) / 4;
  const sdW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const z = (W - meanW) / sdW;
  const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));

  return { test: "Wilcoxon Signed-Rank Test", W, z, pValue: Math.min(1, Math.max(0, pValue)), n };
}

export interface KruskalWallisResult {
  test: string;
  H: number;
  df: number;
  pValue: number;
  groups: { label: string; n: number; meanRank: number }[];
}

export function kruskalWallis(groups: { label: string; values: number[] }[]): KruskalWallisResult {
  const combined = groups.flatMap((g) => g.values);
  const N = combined.length;
  const ranks = rankAll(combined);

  let offset = 0;
  const groupStats = groups.map((g) => {
    const groupRanks = ranks.slice(offset, offset + g.values.length);
    offset += g.values.length;
    const sumRank = groupRanks.reduce((s, r) => s + r, 0);
    return { label: g.label, n: g.values.length, sumRank, meanRank: sumRank / g.values.length };
  });

  const H =
    (12 / (N * (N + 1))) * groupStats.reduce((s, g) => s + g.sumRank ** 2 / g.n, 0) - 3 * (N + 1);
  const df = groups.length - 1;
  const pValue = 1 - jStat.chisquare.cdf(H, df);

  return { test: "Kruskal-Wallis Test", H, df, pValue: Math.min(1, Math.max(0, pValue)), groups: groupStats };
}

export interface FriedmanResult {
  test: string;
  chiSquare: number;
  df: number;
  pValue: number;
  conditionMeanRanks: number[];
}

export function friedmanTest(dataBySubject: number[][]): FriedmanResult {
  const n = dataBySubject.length;
  const k = dataBySubject[0]?.length ?? 0;
  const rankSums = new Array(k).fill(0);

  for (const row of dataBySubject) {
    const ranks = rankAll(row);
    ranks.forEach((r, c) => (rankSums[c] += r));
  }

  const chiSquare = (12 / (n * k * (k + 1))) * rankSums.reduce((s, r) => s + r ** 2, 0) - 3 * n * (k + 1);
  const df = k - 1;
  const pValue = 1 - jStat.chisquare.cdf(chiSquare, df);

  return {
    test: "Friedman Test",
    chiSquare,
    df,
    pValue: Math.min(1, Math.max(0, pValue)),
    conditionMeanRanks: rankSums.map((s) => s / n),
  };
}
