/** Minimal dense-matrix helpers (plain number[][]) - just enough for OLS/IRLS
 * regression, kept in-house rather than depending on a matrix library's exact
 * API surface for numerically load-bearing code. */

export type Mat = number[][];

export function transpose(a: Mat): Mat {
  const rows = a.length;
  const cols = a[0].length;
  const result: Mat = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = a[i][j];
    }
  }
  return result;
}

export function multiply(a: Mat, b: Mat): Mat {
  const rows = a.length;
  const inner = b.length;
  const cols = b[0].length;
  const result: Mat = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let k = 0; k < inner; k++) {
      const aik = a[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < cols; j++) {
        result[i][j] += aik * b[k][j];
      }
    }
  }
  return result;
}

export function multiplyVec(a: Mat, v: number[]): number[] {
  return a.map((row) => row.reduce((s, val, i) => s + val * v[i], 0));
}

/** Gauss-Jordan inversion with partial pivoting. Throws on singular matrices. */
export function inverse(a: Mat): Mat {
  const n = a.length;
  const aug: Mat = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > maxVal) {
        maxVal = Math.abs(aug[r][col]);
        pivotRow = r;
      }
    }
    if (maxVal < 1e-12) {
      throw new Error("Matrix is singular or near-singular (predictors may be collinear).");
    }
    [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];

    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }

  return aug.map((row) => row.slice(n));
}

/** Prepends a column of 1s for the regression intercept term. */
export function withIntercept(x: Mat): Mat {
  return x.map((row) => [1, ...row]);
}

export function identity(n: number): Mat {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}
