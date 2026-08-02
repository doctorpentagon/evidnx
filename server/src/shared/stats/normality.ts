import jStat from "jstat";
import { mean, stdDev } from "./descriptive.js";

export interface NormalityResult {
  test: string;
  statistic: number;
  pValue: number;
}

/**
 * Shapiro-Wilk test, Royston (1995) approximation (AS R94) - the same
 * algorithm used by R's shapiro.test() and SciPy. Valid for 3 <= n <= 5000.
 */
export function shapiroWilk(values: number[]): NormalityResult {
  const x = [...values].sort((a, b) => a - b);
  const n = x.length;
  if (n < 3) return { test: "Shapiro-Wilk", statistic: NaN, pValue: NaN };

  const m: number[] = [];
  for (let i = 1; i <= n; i++) {
    m.push(jStat.normal.inv((i - 0.375) / (n + 0.25), 0, 1));
  }
  const ssM = m.reduce((s, v) => s + v * v, 0);
  const rsn = 1 / Math.sqrt(n);

  const a = new Array(n).fill(0);
  const c = m.map((v) => v / Math.sqrt(ssM));

  if (n > 5) {
    const a_n = -2.706056 * rsn ** 5 + 4.434685 * rsn ** 4 - 2.071190 * rsn ** 3 - 0.147981 * rsn ** 2 + 0.221157 * rsn + c[n - 1];
    const a_n1 = -3.582633 * rsn ** 5 + 5.682633 * rsn ** 4 - 1.752461 * rsn ** 3 - 0.293762 * rsn ** 2 + 0.042981 * rsn + c[n - 2];
    a[n - 1] = a_n;
    a[0] = -a_n;
    a[n - 2] = a_n1;
    a[1] = -a_n1;

    const phi = (ssM - 2 * m[n - 1] ** 2 - 2 * m[n - 2] ** 2) / (1 - 2 * a_n ** 2 - 2 * a_n1 ** 2);
    for (let i = 2; i < n - 2; i++) {
      a[i] = m[i] / Math.sqrt(phi);
    }
  } else {
    const a_n = -2.706056 * rsn ** 5 + 4.434685 * rsn ** 4 - 2.071190 * rsn ** 3 - 0.147981 * rsn ** 2 + 0.221157 * rsn + c[n - 1];
    a[n - 1] = a_n;
    a[0] = -a_n;
    const phi = (ssM - 2 * m[n - 1] ** 2) / (1 - 2 * a_n ** 2);
    for (let i = 1; i < n - 1; i++) {
      a[i] = m[i] / Math.sqrt(phi);
    }
  }

  const xBar = mean(x);
  const numerator = a.reduce((s, ai, i) => s + ai * x[i], 0) ** 2;
  const denominator = x.reduce((s, v) => s + (v - xBar) ** 2, 0);
  const W = numerator / denominator;

  // Royston's normalizing transformation for W -> z, then p from the normal CDF.
  let mu: number;
  let sigma: number;
  const lnN = Math.log(n);
  if (n === 3) {
    // Exact distribution for n=3 (Royston 1995).
    const pi6 = 1.90985931710274; // 6/pi... kept literal per Royston's constant
    const stqr = 1.04719755119660; // asin(sqrt(3/4))
    const w = Math.max(1e-12, W);
    const stat = (Math.asin(Math.sqrt(w)) - stqr) * pi6;
    return { test: "Shapiro-Wilk", statistic: W, pValue: clampP(1 - jStat.normal.cdf(stat, 0, 1)) };
  } else if (n <= 11) {
    const gamma = -2.273 + 0.459 * n;
    const w1 = -Math.log(gamma - Math.log(1 - W));
    mu = 0.5440 - 0.39978 * n + 0.025054 * n ** 2 - 0.0006714 * n ** 3;
    sigma = Math.exp(1.3822 - 0.77857 * n + 0.062767 * n ** 2 - 0.0020322 * n ** 3);
    const z = (w1 - mu) / sigma;
    return { test: "Shapiro-Wilk", statistic: W, pValue: clampP(1 - jStat.normal.cdf(z, 0, 1)) };
  } else {
    const w1 = Math.log(1 - W);
    mu = -1.5861 - 0.31082 * lnN - 0.083751 * lnN ** 2 + 0.0038915 * lnN ** 3;
    sigma = Math.exp(-0.4803 - 0.082676 * lnN + 0.0030302 * lnN ** 2);
    const z = (w1 - mu) / sigma;
    return { test: "Shapiro-Wilk", statistic: W, pValue: clampP(1 - jStat.normal.cdf(z, 0, 1)) };
  }
}

function clampP(p: number): number {
  return Math.min(1, Math.max(0, p));
}

/**
 * One-sample Kolmogorov-Smirnov test against a normal distribution fitted
 * from the sample mean/SD, with the Lilliefors correction applied to the
 * p-value (Dallal & Wilkinson 1986 approximation), since the parameters are
 * estimated from the data rather than known in advance.
 */
export function kolmogorovSmirnovLilliefors(values: number[]): NormalityResult {
  const n = values.length;
  const x = [...values].sort((a, b) => a - b);
  const m = mean(x);
  const s = stdDev(x);

  let D = 0;
  for (let i = 0; i < n; i++) {
    const cdf = jStat.normal.cdf(x[i], m, s);
    const empiricalUpper = (i + 1) / n;
    const empiricalLower = i / n;
    D = Math.max(D, Math.abs(cdf - empiricalUpper), Math.abs(cdf - empiricalLower));
  }

  // Dallal-Wilkinson (1986) approximation, accurate for p roughly in [0.1, 0.9].
  let pValue: number;
  if (n <= 100) {
    pValue = Math.exp(
      -7.01256 * D ** 2 * (n + 2.78019) +
        2.99587 * D * Math.sqrt(n + 2.78019) -
        0.122119 +
        0.974598 / Math.sqrt(n) +
        1.67997 / n,
    );
  } else {
    const Dstar = D * (Math.sqrt(n) + 0.85 + 0.01 / Math.sqrt(n));
    pValue = 2 * Math.exp(-2 * Dstar ** 2);
  }

  return { test: "Kolmogorov-Smirnov (Lilliefors)", statistic: D, pValue: clampP(pValue) };
}

/**
 * Anderson-Darling test against a normal distribution, using the
 * D'Agostino & Stephens (1986) small-sample adjustment and approximate
 * p-value bands.
 */
export function andersonDarling(values: number[]): NormalityResult {
  const n = values.length;
  const x = [...values].sort((a, b) => a - b);
  const m = mean(x);
  const s = stdDev(x);
  const cdf = x.map((v) => jStat.normal.cdf(v, m, s));

  let S = 0;
  for (let i = 0; i < n; i++) {
    const p1 = Math.min(Math.max(cdf[i], 1e-12), 1 - 1e-12);
    const p2 = Math.min(Math.max(cdf[n - 1 - i], 1e-12), 1 - 1e-12);
    S += (2 * (i + 1) - 1) * (Math.log(p1) + Math.log(1 - p2));
  }
  const A2 = -n - S / n;
  const A2star = A2 * (1 + 0.75 / n + 2.25 / n ** 2);

  let pValue: number;
  if (A2star < 0.2) {
    pValue = 1 - Math.exp(-13.436 + 101.14 * A2star - 223.73 * A2star ** 2);
  } else if (A2star < 0.34) {
    pValue = 1 - Math.exp(-8.318 + 42.796 * A2star - 59.938 * A2star ** 2);
  } else if (A2star < 0.6) {
    pValue = Math.exp(0.9177 - 4.279 * A2star - 1.38 * A2star ** 2);
  } else {
    pValue = Math.exp(1.2937 - 5.709 * A2star + 0.0186 * A2star ** 2);
  }

  return { test: "Anderson-Darling", statistic: A2star, pValue: clampP(pValue) };
}
