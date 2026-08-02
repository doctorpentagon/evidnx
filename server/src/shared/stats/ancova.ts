import jStat from "jstat";
import { linearRegression } from "./regression.js";

export interface AncovaResult {
  adjustedMeans: { group: string; adjustedMean: number }[];
  covariateEffect: { estimate: number; pValue: number };
  groupEffect: { F: number; df1: number; df2: number; pValue: number };
  r2: number;
}

/**
 * ANCOVA via dummy-coded regression: fit DV ~ covariate + group dummies (full
 * model) and DV ~ covariate (reduced model), then compare via sequential
 * (Type I) sum-of-squares F-test for the group effect controlling for the
 * covariate - the standard regression-equivalent formulation of ANCOVA.
 */
export function ancova(
  group: string[],
  covariate: number[],
  dv: number[],
): AncovaResult {
  const groupLevels = [...new Set(group)];
  const n = dv.length;

  const dummies = groupLevels.slice(1).map((level) => group.map((g) => (g === level ? 1 : 0)));
  const fullPredictors = covariate.map((c, i) => [c, ...dummies.map((d) => d[i])]);
  const reducedPredictors = covariate.map((c) => [c]);

  const fullModel = linearRegression(fullPredictors, dv, ["Covariate", ...groupLevels.slice(1)]);
  const reducedModel = linearRegression(reducedPredictors, dv, ["Covariate"]);

  const ssResidualFull = fullModel.residuals.reduce((s, r) => s + r * r, 0);
  const ssResidualReduced = reducedModel.residuals.reduce((s, r) => s + r * r, 0);
  const dfExtra = groupLevels.length - 1;
  const dfResidualFull = fullModel.dfResidual;

  const F = ((ssResidualReduced - ssResidualFull) / dfExtra) / (ssResidualFull / dfResidualFull);
  const pValue = 1 - jStat.centralF.cdf(F, dfExtra, dfResidualFull);

  const covariateMean = covariate.reduce((s, v) => s + v, 0) / n;
  const covariateCoef = fullModel.coefficients[1].estimate;
  const intercept = fullModel.coefficients[0].estimate;

  const adjustedMeans = groupLevels.map((level, idx) => {
    const dummyCoef = idx === 0 ? 0 : fullModel.coefficients.find((c) => c.name === level)?.estimate ?? 0;
    return {
      group: level,
      adjustedMean: intercept + dummyCoef + covariateCoef * covariateMean,
    };
  });

  return {
    adjustedMeans,
    covariateEffect: { estimate: covariateCoef, pValue: fullModel.coefficients[1].pValue },
    groupEffect: { F, df1: dfExtra, df2: dfResidualFull, pValue: Math.min(1, Math.max(0, pValue)) },
    r2: fullModel.r2,
  };
}
