import jStat from "jstat";
import { inverse, multiply, multiplyVec, transpose, withIntercept, type Mat } from "./matrix.js";
import { classifyCohenF2 } from "./effectSize.js";

export interface Coefficient {
  name: string;
  estimate: number;
  standardError: number;
  t: number;
  pValue: number;
  vif: number | null;
}

export interface LinearRegressionResult {
  coefficients: Coefficient[];
  r2: number;
  adjR2: number;
  F: number;
  dfModel: number;
  dfResidual: number;
  pValue: number;
  fitted: number[];
  residuals: number[];
  n: number;
}

/**
 * Ordinary least squares via the normal equations, beta = (X'X)^-1 X'y.
 * Fine for the dataset sizes this product targets (in-browser-uploaded
 * survey/research data, not big-data scale).
 */
export function linearRegression(predictors: Mat, y: number[], predictorNames: string[]): LinearRegressionResult {
  const n = y.length;
  const X = withIntercept(predictors);
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const XtXInv = inverse(XtX);
  const Xty = multiplyVec(Xt, y);
  const beta = multiplyVec(XtXInv, Xty);

  const fitted = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  const residuals = y.map((v, i) => v - fitted[i]);

  const yMean = y.reduce((s, v) => s + v, 0) / n;
  const ssTotal = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssResidual = residuals.reduce((s, v) => s + v ** 2, 0);
  const ssModel = ssTotal - ssResidual;

  const k = predictorNames.length; // number of predictors, excluding intercept
  const dfModel = k;
  const dfResidual = n - k - 1;
  const mse = ssResidual / dfResidual;

  const r2 = ssModel / ssTotal;
  const adjR2 = 1 - (1 - r2) * ((n - 1) / dfResidual);
  const F = (ssModel / dfModel) / mse;
  const pValue = 1 - jStat.centralF.cdf(F, dfModel, dfResidual);

  const seBeta = beta.map((_, i) => Math.sqrt(mse * XtXInv[i][i]));
  const vifs = computeVIF(predictors);

  const names = ["Intercept", ...predictorNames];
  const coefficients: Coefficient[] = beta.map((estimate, i) => {
    const se = seBeta[i];
    const t = estimate / se;
    return {
      name: names[i],
      estimate,
      standardError: se,
      t,
      pValue: 2 * (1 - jStat.studentt.cdf(Math.abs(t), dfResidual)),
      vif: i === 0 ? null : vifs[i - 1],
    };
  });

  return { coefficients, r2, adjR2, F, dfModel, dfResidual, pValue: Math.min(1, Math.max(0, pValue)), fitted, residuals, n };
}

/** Variance Inflation Factor per predictor: regress each predictor on all others. */
function computeVIF(predictors: Mat): number[] {
  const k = predictors[0].length;
  if (k < 2) return predictors[0] ? [1] : [];
  const vifs: number[] = [];
  for (let target = 0; target < k; target++) {
    const y = predictors.map((row) => row[target]);
    const others = predictors.map((row) => row.filter((_, i) => i !== target));
    try {
      const X = withIntercept(others);
      const Xt = transpose(X);
      const XtXInv = inverse(multiply(Xt, X));
      const beta = multiplyVec(XtXInv, multiplyVec(Xt, y));
      const fitted = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
      const yMean = y.reduce((s, v) => s + v, 0) / y.length;
      const ssTotal = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
      const ssResidual = y.reduce((s, v, i) => s + (v - fitted[i]) ** 2, 0);
      const r2 = 1 - ssResidual / ssTotal;
      vifs.push(1 / (1 - r2));
    } catch {
      vifs.push(Infinity);
    }
  }
  return vifs;
}

export function cohenF2FromR2(r2Full: number, r2Reduced: number): { f2: number; label: string } {
  const f2 = (r2Full - r2Reduced) / (1 - r2Full);
  return { f2, label: classifyCohenF2(f2) };
}

export interface LogisticRegressionResult {
  coefficients: { name: string; estimate: number; standardError: number; z: number; pValue: number; oddsRatio: number }[];
  mcFaddenR2: number;
  logLikelihood: number;
  nullLogLikelihood: number;
  iterations: number;
  n: number;
  accuracy: number;
}

/**
 * Binary logistic regression via Iteratively Reweighted Least Squares
 * (Newton-Raphson on the log-likelihood) - gives coefficients AND their
 * standard errors from the inverse Fisher information, unlike gradient-descent
 * implementations that only fit point estimates.
 */
export function logisticRegression(
  predictors: Mat,
  y: number[],
  predictorNames: string[],
  maxIterations = 50,
): LogisticRegressionResult {
  const n = y.length;
  const X = withIntercept(predictors);
  const p = X[0].length;
  let beta = new Array(p).fill(0);

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  let iterations = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;
    const eta = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
    const mu = eta.map(sigmoid);
    const w = mu.map((m) => Math.max(m * (1 - m), 1e-8));

    // Weighted normal equations: (X' W X) delta = X' W z, working response z = eta + (y - mu) / w
    const z = eta.map((e, i) => e + (y[i] - mu[i]) / w[i]);
    const Xt = transpose(X);
    const WX = X.map((row, i) => row.map((v) => v * w[i]));
    const XtWXMat = multiply(Xt, WX);
    const XtWz = multiplyVec(Xt, z.map((v, i) => v * w[i]));

    let XtWXInv: Mat;
    try {
      XtWXInv = inverse(XtWXMat);
    } catch {
      break;
    }
    const newBeta = multiplyVec(XtWXInv, XtWz);

    const delta = newBeta.reduce((s, v, i) => s + Math.abs(v - beta[i]), 0);
    beta = newBeta;
    if (delta < 1e-8) break;
  }

  const eta = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  const mu = eta.map(sigmoid);
  const w = mu.map((m) => Math.max(m * (1 - m), 1e-8));
  const Xt = transpose(X);
  const WX = X.map((row, i) => row.map((v) => v * w[i]));
  const fisherInfo = multiply(Xt, WX);
  const covMatrix = inverse(fisherInfo);
  const se = beta.map((_, i) => Math.sqrt(Math.abs(covMatrix[i][i])));

  const logLikelihood = y.reduce((s, yi, i) => {
    const p = Math.min(Math.max(mu[i], 1e-10), 1 - 1e-10);
    return s + yi * Math.log(p) + (1 - yi) * Math.log(1 - p);
  }, 0);

  const yMean = y.reduce((s, v) => s + v, 0) / n;
  const nullLogLikelihood = y.reduce((s, yi) => s + yi * Math.log(yMean) + (1 - yi) * Math.log(1 - yMean), 0);
  const mcFaddenR2 = 1 - logLikelihood / nullLogLikelihood;

  const predictions = mu.map((m) => (m >= 0.5 ? 1 : 0));
  const accuracy = predictions.filter((p, i) => p === y[i]).length / n;

  const names = ["Intercept", ...predictorNames];
  const coefficients = beta.map((estimate, i) => {
    const seI = se[i];
    const zScore = estimate / seI;
    return {
      name: names[i],
      estimate,
      standardError: seI,
      z: zScore,
      pValue: 2 * (1 - jStat.normal.cdf(Math.abs(zScore), 0, 1)),
      oddsRatio: Math.exp(estimate),
    };
  });

  return { coefficients, mcFaddenR2, logLikelihood, nullLogLikelihood, iterations, n, accuracy };
}
