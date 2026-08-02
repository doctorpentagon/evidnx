/** Core numeric primitives shared by dataset cleaning and every analysis module. */

export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function mode(values: (string | number)[]): (string | number)[] {
  const counts = new Map<string | number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const max = Math.max(...counts.values());
  return [...counts.entries()].filter(([, c]) => c === max).map(([v]) => v);
}

export function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}

/** Sample variance (n-1 denominator) - the standard for inferential statistics. */
export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

export function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function standardError(values: number[]): number {
  return stdDev(values) / Math.sqrt(values.length);
}

export function min(values: number[]): number {
  return Math.min(...values);
}

export function max(values: number[]): number {
  return Math.max(...values);
}

export function range(values: number[]): number {
  return max(values) - min(values);
}

/** Linear-interpolation quantile, matching the common "type 7" definition (Excel/NumPy default). */
export function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/** Sample skewness (Fisher-Pearson standardized moment coefficient, bias-corrected). */
export function skewness(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const m = mean(values);
  const s = stdDev(values);
  if (s === 0) return 0;
  const g1 = values.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / n;
  return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
}

/** Sample excess kurtosis (bias-corrected). */
export function kurtosis(values: number[]): number {
  const n = values.length;
  if (n < 4) return 0;
  const m = mean(values);
  const s = stdDev(values);
  if (s === 0) return 0;
  const m4 = values.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0) / n;
  return ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * m4 - 3 * (n - 1)) + 3 - 3;
}

export function zScores(values: number[]): number[] {
  const m = mean(values);
  const s = stdDev(values);
  return values.map((v) => (s === 0 ? 0 : (v - m) / s));
}

export interface DescriptiveSummary {
  n: number;
  mean: number;
  median: number;
  mode: (string | number)[];
  sum: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  skewness: number;
  kurtosis: number;
  standardError: number;
}

export function describe(values: number[]): DescriptiveSummary {
  return {
    n: values.length,
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    sum: sum(values),
    stdDev: stdDev(values),
    variance: variance(values),
    min: min(values),
    max: max(values),
    range: range(values),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
    skewness: skewness(values),
    kurtosis: kurtosis(values),
    standardError: standardError(values),
  };
}

export function frequencyTable(values: (string | number)[]) {
  const counts = new Map<string | number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const total = values.length;
  return [...counts.entries()]
    .map(([category, n]) => ({ category, n, percent: (n / total) * 100 }))
    .sort((a, b) => b.n - a.n);
}
