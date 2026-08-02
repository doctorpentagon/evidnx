import { kmeans } from "ml-kmeans";
import { runPCA } from "./pca.js";

export interface ClusterResult {
  k: number;
  assignments: number[];
  centroids: number[][];
  clusterSizes: number[];
  /** 2D PCA-reduced coordinates per row, for plotting when there are >2 variables. */
  plot2D: { x: number; y: number; cluster: number }[];
  explainedVarianceFirstTwoComponents: number;
}

export function runKMeans(variableNames: string[], data: number[][], k: number): ClusterResult {
  const result = kmeans(data, k, { initialization: "kmeans++", seed: 42 });
  const assignments: number[] = result.clusters;
  const centroids: number[][] = result.centroids;

  const clusterSizes = Array.from({ length: k }, (_, c) => assignments.filter((a) => a === c).length);

  let plot2D: { x: number; y: number; cluster: number }[];
  let explainedVarianceFirstTwoComponents: number;

  if (variableNames.length >= 2) {
    const pca = runPCA(variableNames, data);
    plot2D = pca.scores.map((row, i) => ({ x: row[0], y: row[1] ?? 0, cluster: assignments[i] }));
    explainedVarianceFirstTwoComponents = (pca.explainedVariance[0] ?? 0) + (pca.explainedVariance[1] ?? 0);
  } else {
    plot2D = data.map((row, i) => ({ x: row[0], y: 0, cluster: assignments[i] }));
    explainedVarianceFirstTwoComponents = 1;
  }

  return { k, assignments, centroids, clusterSizes, plot2D, explainedVarianceFirstTwoComponents };
}
