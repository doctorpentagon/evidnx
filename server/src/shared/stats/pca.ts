import { PCA } from "ml-pca";

export interface PCAResult {
  explainedVariance: number[];
  cumulativeVariance: number[];
  loadings: { variable: string; components: number[] }[];
  scores: number[][];
  nComponentsFor80Percent: number;
}

/** Principal Component Analysis on standardized (centered + scaled) variables. */
export function runPCA(variableNames: string[], data: number[][]): PCAResult {
  const pca = new PCA(data, { center: true, scale: true });
  const explainedVariance = pca.getExplainedVariance();
  const cumulativeVariance = pca.getCumulativeVariance();
  const loadingsMatrix = pca.getLoadings().to2DArray();
  const scoresMatrix = pca.predict(data).to2DArray();

  const nComponentsFor80Percent = cumulativeVariance.findIndex((v: number) => v >= 0.8) + 1;

  return {
    explainedVariance,
    cumulativeVariance,
    loadings: variableNames.map((name, i) => ({ variable: name, components: loadingsMatrix[i] })),
    scores: scoresMatrix,
    nComponentsFor80Percent: nComponentsFor80Percent || variableNames.length,
  };
}
