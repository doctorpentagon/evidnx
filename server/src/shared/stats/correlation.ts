import jStat from "jstat";
import { mean } from "./descriptive.js";
import { classifyCorrelationR } from "./effectSize.js";

export interface CorrelationResult {
  method: "pearson" | "spearman" | "kendall";
  r: number;
  n: number;
  pValue: number;
  effectSizeLabel: string;
}

function pearsonR(x: number[], y: number[]): number {
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return num / Math.sqrt(dx2 * dy2);
}

function rToP(r: number, n: number): number {
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  return 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));
}

export function pearsonCorrelation(x: number[], y: number[]): CorrelationResult {
  const r = pearsonR(x, y);
  return { method: "pearson", r, n: x.length, pValue: rToP(r, x.length), effectSizeLabel: classifyCorrelationR(r) };
}

function rank(values: number[]): number[] {
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

export function spearmanCorrelation(x: number[], y: number[]): CorrelationResult {
  const rx = rank(x);
  const ry = rank(y);
  const r = pearsonR(rx, ry);
  return { method: "spearman", r, n: x.length, pValue: rToP(r, x.length), effectSizeLabel: classifyCorrelationR(r) };
}

export function kendallTau(x: number[], y: number[]): CorrelationResult {
  const n = x.length;
  let concordant = 0;
  let discordant = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sign = Math.sign(x[j] - x[i]) * Math.sign(y[j] - y[i]);
      if (sign > 0) concordant++;
      else if (sign < 0) discordant++;
    }
  }
  const totalPairs = (n * (n - 1)) / 2;
  const tau = (concordant - discordant) / totalPairs;
  const variance = (2 * (2 * n + 5)) / (9 * n * (n - 1));
  const z = tau / Math.sqrt(variance);
  const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
  return { method: "kendall", r: tau, n, pValue: Math.min(1, Math.max(0, pValue)), effectSizeLabel: classifyCorrelationR(tau) };
}

export interface CorrelationMatrixCell {
  rowVar: string;
  colVar: string;
  r: number;
  pValue: number;
}

export function correlationMatrix(
  variables: { name: string; values: number[] }[],
  method: "pearson" | "spearman" = "pearson",
): CorrelationMatrixCell[] {
  const fn = method === "pearson" ? pearsonCorrelation : spearmanCorrelation;
  const cells: CorrelationMatrixCell[] = [];
  for (const rowVar of variables) {
    for (const colVar of variables) {
      const result = rowVar.name === colVar.name ? { r: 1, pValue: 0 } : fn(rowVar.values, colVar.values);
      cells.push({ rowVar: rowVar.name, colVar: colVar.name, r: result.r, pValue: result.pValue });
    }
  }
  return cells;
}
