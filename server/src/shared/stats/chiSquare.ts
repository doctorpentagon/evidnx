import jStat from "jstat";

export interface ChiSquareResult {
  test: string;
  statistic: number;
  df: number;
  pValue: number;
  contingencyTable: { rowLabel: string; cells: number[]; rowTotal: number }[];
  columnLabels: string[];
  columnTotals: number[];
  grandTotal: number;
  expectedTable: number[][];
  cramersV: number;
}

/** Chi-square test of independence, built directly from raw category pairs. */
export function chiSquareTest(rows: string[], cols: string[]): ChiSquareResult {
  const rowLabels = [...new Set(rows)];
  const colLabels = [...new Set(cols)];
  const observed: number[][] = rowLabels.map(() => colLabels.map(() => 0));

  for (let i = 0; i < rows.length; i++) {
    const r = rowLabels.indexOf(rows[i]);
    const c = colLabels.indexOf(cols[i]);
    observed[r][c] += 1;
  }

  const rowTotals = observed.map((row) => row.reduce((s, v) => s + v, 0));
  const colTotals = colLabels.map((_, c) => observed.reduce((s, row) => s + row[c], 0));
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

  const expected: number[][] = rowLabels.map((_, r) =>
    colLabels.map((_, c) => (rowTotals[r] * colTotals[c]) / grandTotal),
  );

  let statistic = 0;
  for (let r = 0; r < rowLabels.length; r++) {
    for (let c = 0; c < colLabels.length; c++) {
      const e = expected[r][c];
      if (e > 0) statistic += (observed[r][c] - e) ** 2 / e;
    }
  }

  const df = (rowLabels.length - 1) * (colLabels.length - 1);
  const pValue = 1 - jStat.chisquare.cdf(statistic, df);
  const minDim = Math.min(rowLabels.length - 1, colLabels.length - 1) || 1;
  const cramersV = Math.sqrt(statistic / (grandTotal * minDim));

  return {
    test: "Chi-Square Test of Independence",
    statistic,
    df,
    pValue: Math.min(1, Math.max(0, pValue)),
    contingencyTable: rowLabels.map((label, r) => ({ rowLabel: label, cells: observed[r], rowTotal: rowTotals[r] })),
    columnLabels: colLabels,
    columnTotals: colTotals,
    grandTotal,
    expectedTable: expected,
    cramersV,
  };
}
