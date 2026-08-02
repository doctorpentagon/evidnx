import jStat from "jstat";
import { linearRegression } from "./regression.js";

export interface ModerationResult {
  mainEffectX: { estimate: number; pValue: number };
  mainEffectM: { estimate: number; pValue: number };
  interaction: { estimate: number; standardError: number; pValue: number; significant: boolean };
  r2: number;
}

/** Moderation via an interaction term: Y ~ X + M + X*M. */
export function testModeration(x: number[], m: number[], y: number[]): ModerationResult {
  const interactionTerm = x.map((xi, i) => xi * m[i]);
  const predictors = x.map((xi, i) => [xi, m[i], interactionTerm[i]]);
  const result = linearRegression(predictors, y, ["X", "M", "X × M"]);

  return {
    mainEffectX: { estimate: result.coefficients[1].estimate, pValue: result.coefficients[1].pValue },
    mainEffectM: { estimate: result.coefficients[2].estimate, pValue: result.coefficients[2].pValue },
    interaction: {
      estimate: result.coefficients[3].estimate,
      standardError: result.coefficients[3].standardError,
      pValue: result.coefficients[3].pValue,
      significant: result.coefficients[3].pValue < 0.05,
    },
    r2: result.r2,
  };
}

export interface MediationResult {
  pathA: { estimate: number; standardError: number; pValue: number };
  pathB: { estimate: number; standardError: number; pValue: number };
  directEffect: { estimate: number; pValue: number };
  totalEffect: { estimate: number; pValue: number };
  indirectEffect: number;
  sobelZ: number;
  sobelP: number;
  proportionMediated: number;
}

/**
 * Baron & Kenny (1986) causal-steps mediation with a Sobel test for the
 * indirect effect - the standard, well-established approach for a simple
 * single-mediator model (X -> M -> Y).
 */
export function testMediation(x: number[], mediator: number[], y: number[]): MediationResult {
  const totalModel = linearRegression(
    x.map((xi) => [xi]),
    y,
    ["X"],
  );
  const pathAModel = linearRegression(
    x.map((xi) => [xi]),
    mediator,
    ["X"],
  );
  const pathBModel = linearRegression(
    x.map((xi, i) => [xi, mediator[i]]),
    y,
    ["X", "M"],
  );

  const a = pathAModel.coefficients[1];
  const b = pathBModel.coefficients[2];
  const indirectEffect = a.estimate * b.estimate;

  const sobelSE = Math.sqrt(b.estimate ** 2 * a.standardError ** 2 + a.estimate ** 2 * b.standardError ** 2);
  const sobelZ = indirectEffect / sobelSE;
  const sobelP = 2 * (1 - jStat.normal.cdf(Math.abs(sobelZ), 0, 1));

  const totalEffect = totalModel.coefficients[1];
  const directEffect = pathBModel.coefficients[1];

  return {
    pathA: { estimate: a.estimate, standardError: a.standardError, pValue: a.pValue },
    pathB: { estimate: b.estimate, standardError: b.standardError, pValue: b.pValue },
    directEffect: { estimate: directEffect.estimate, pValue: directEffect.pValue },
    totalEffect: { estimate: totalEffect.estimate, pValue: totalEffect.pValue },
    indirectEffect,
    sobelZ,
    sobelP: Math.min(1, Math.max(0, sobelP)),
    proportionMediated: indirectEffect / totalEffect.estimate,
  };
}
