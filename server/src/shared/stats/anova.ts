import jStat from "jstat";
import { mean } from "./descriptive.js";
import { classifyEtaSquared } from "./effectSize.js";

export interface GroupInput {
  label: string;
  values: number[];
}

export interface OneWayAnovaResult {
  groups: { label: string; n: number; mean: number; sd: number }[];
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
  F: number;
  pValue: number;
  etaSquared: number;
  etaSquaredLabel: string;
}

export function oneWayAnova(groups: GroupInput[]): OneWayAnovaResult {
  const k = groups.length;
  const all = groups.flatMap((g) => g.values);
  const N = all.length;
  const grandMean = mean(all);

  const groupMeans = groups.map((g) => mean(g.values));
  const ssBetween = groups.reduce((s, g, i) => s + g.values.length * (groupMeans[i] - grandMean) ** 2, 0);
  const ssWithin = groups.reduce(
    (s, g, i) => s + g.values.reduce((acc, v) => acc + (v - groupMeans[i]) ** 2, 0),
    0,
  );
  const ssTotal = ssBetween + ssWithin;
  const dfBetween = k - 1;
  const dfWithin = N - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const F = msBetween / msWithin;
  const pValue = 1 - jStat.centralF.cdf(F, dfBetween, dfWithin);
  const etaSquared = ssBetween / ssTotal;

  return {
    groups: groups.map((g, i) => ({
      label: g.label,
      n: g.values.length,
      mean: groupMeans[i],
      sd: Math.sqrt(g.values.reduce((acc, v) => acc + (v - groupMeans[i]) ** 2, 0) / (g.values.length - 1)),
    })),
    ssBetween,
    ssWithin,
    ssTotal,
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    F,
    pValue: Math.min(1, Math.max(0, pValue)),
    etaSquared,
    etaSquaredLabel: classifyEtaSquared(etaSquared),
  };
}

export interface PostHocRow {
  groupA: string;
  groupB: string;
  meanDifference: number;
  pValue: number;
  significant: boolean;
}

/** Bonferroni-corrected pairwise t-tests using the ANOVA's pooled MSE. */
export function bonferroniPostHoc(groups: GroupInput[], anova: OneWayAnovaResult): PostHocRow[] {
  const rows: PostHocRow[] = [];
  const numComparisons = (groups.length * (groups.length - 1)) / 2;
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const gi = groups[i];
      const gj = groups[j];
      const mi = mean(gi.values);
      const mj = mean(gj.values);
      const se = Math.sqrt(anova.msWithin * (1 / gi.values.length + 1 / gj.values.length));
      const t = (mi - mj) / se;
      const rawP = 2 * (1 - jStat.studentt.cdf(Math.abs(t), anova.dfWithin));
      const adjP = Math.min(1, rawP * numComparisons);
      rows.push({ groupA: gi.label, groupB: gj.label, meanDifference: mi - mj, pValue: adjP, significant: adjP < 0.05 });
    }
  }
  return rows;
}

/** Scheffe's post-hoc test - more conservative, valid for any contrast, not just pairwise. */
export function scheffePostHoc(groups: GroupInput[], anova: OneWayAnovaResult): PostHocRow[] {
  const rows: PostHocRow[] = [];
  const critF = jStat.centralF.inv(0.95, anova.dfBetween, anova.dfWithin);
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const gi = groups[i];
      const gj = groups[j];
      const mi = mean(gi.values);
      const mj = mean(gj.values);
      const se = Math.sqrt(anova.msWithin * (1 / gi.values.length + 1 / gj.values.length));
      const F = (mi - mj) ** 2 / (se ** 2 * anova.dfBetween);
      const scheffeCrit = critF;
      const pValue = 1 - jStat.centralF.cdf(F, anova.dfBetween, anova.dfWithin);
      rows.push({
        groupA: gi.label,
        groupB: gj.label,
        meanDifference: mi - mj,
        pValue: Math.min(1, Math.max(0, pValue)),
        significant: F > scheffeCrit,
      });
    }
  }
  return rows;
}

/**
 * Two-way (factorial) ANOVA for a balanced or unbalanced design, using
 * Type I (sequential) sums of squares - correct and standard for the
 * between-subjects factorial case this product exposes.
 */
export interface TwoWayAnovaResult {
  factorA: { name: string; ss: number; df: number; ms: number; F: number; pValue: number; etaSquared: number };
  factorB: { name: string; ss: number; df: number; ms: number; F: number; pValue: number; etaSquared: number };
  interaction: { ss: number; df: number; ms: number; F: number; pValue: number; etaSquared: number };
  ssWithin: number;
  dfWithin: number;
  msWithin: number;
  ssTotal: number;
}

export function twoWayAnova(
  data: { factorA: string; factorB: string; value: number }[],
  factorAName: string,
  factorBName: string,
): TwoWayAnovaResult {
  const N = data.length;
  const grandMean = mean(data.map((d) => d.value));
  const levelsA = [...new Set(data.map((d) => d.factorA))];
  const levelsB = [...new Set(data.map((d) => d.factorB))];

  const cellMeanOf = (a: string, b: string) => {
    const cell = data.filter((d) => d.factorA === a && d.factorB === b).map((d) => d.value);
    return { mean: mean(cell), n: cell.length, values: cell };
  };

  const ssTotal = data.reduce((s, d) => s + (d.value - grandMean) ** 2, 0);

  const marginalA = levelsA.map((a) => {
    const vals = data.filter((d) => d.factorA === a).map((d) => d.value);
    return { level: a, mean: mean(vals), n: vals.length };
  });
  const marginalB = levelsB.map((b) => {
    const vals = data.filter((d) => d.factorB === b).map((d) => d.value);
    return { level: b, mean: mean(vals), n: vals.length };
  });

  const ssA = marginalA.reduce((s, m) => s + m.n * (m.mean - grandMean) ** 2, 0);
  const ssB = marginalB.reduce((s, m) => s + m.n * (m.mean - grandMean) ** 2, 0);

  let ssCells = 0;
  for (const a of levelsA) {
    for (const b of levelsB) {
      const cell = cellMeanOf(a, b);
      if (cell.n > 0) ssCells += cell.n * (cell.mean - grandMean) ** 2;
    }
  }
  const ssInteraction = ssCells - ssA - ssB;

  let ssWithin = 0;
  for (const a of levelsA) {
    for (const b of levelsB) {
      const cell = cellMeanOf(a, b);
      ssWithin += cell.values.reduce((s, v) => s + (v - cell.mean) ** 2, 0);
    }
  }

  const dfA = levelsA.length - 1;
  const dfB = levelsB.length - 1;
  const dfInteraction = dfA * dfB;
  const dfWithin = N - levelsA.length * levelsB.length;

  const msA = ssA / dfA;
  const msB = ssB / dfB;
  const msInteraction = ssInteraction / dfInteraction;
  const msWithin = ssWithin / dfWithin;

  const fA = msA / msWithin;
  const fB = msB / msWithin;
  const fInteraction = msInteraction / msWithin;

  return {
    factorA: {
      name: factorAName,
      ss: ssA,
      df: dfA,
      ms: msA,
      F: fA,
      pValue: 1 - jStat.centralF.cdf(fA, dfA, dfWithin),
      etaSquared: ssA / ssTotal,
    },
    factorB: {
      name: factorBName,
      ss: ssB,
      df: dfB,
      ms: msB,
      F: fB,
      pValue: 1 - jStat.centralF.cdf(fB, dfB, dfWithin),
      etaSquared: ssB / ssTotal,
    },
    interaction: {
      ss: ssInteraction,
      df: dfInteraction,
      ms: msInteraction,
      F: fInteraction,
      pValue: 1 - jStat.centralF.cdf(fInteraction, dfInteraction, dfWithin),
      etaSquared: ssInteraction / ssTotal,
    },
    ssWithin,
    dfWithin,
    msWithin,
    ssTotal,
  };
}

/** One-way repeated-measures ANOVA (within-subjects, single factor). */
export interface RepeatedMeasuresResult {
  ssConditions: number;
  ssSubjects: number;
  ssError: number;
  dfConditions: number;
  dfSubjects: number;
  dfError: number;
  msConditions: number;
  msError: number;
  F: number;
  pValue: number;
  etaSquared: number;
}

export function repeatedMeasuresAnova(dataBySubject: number[][]): RepeatedMeasuresResult {
  const nSubjects = dataBySubject.length;
  const kConditions = dataBySubject[0]?.length ?? 0;
  const N = nSubjects * kConditions;
  const grand = mean(dataBySubject.flat());

  const conditionMeans: number[] = [];
  for (let c = 0; c < kConditions; c++) {
    conditionMeans.push(mean(dataBySubject.map((row) => row[c])));
  }
  const subjectMeans = dataBySubject.map((row) => mean(row));

  const ssTotal = dataBySubject.flat().reduce((s, v) => s + (v - grand) ** 2, 0);
  const ssConditions = conditionMeans.reduce((s, m) => s + nSubjects * (m - grand) ** 2, 0);
  const ssSubjects = subjectMeans.reduce((s, m) => s + kConditions * (m - grand) ** 2, 0);
  const ssError = ssTotal - ssConditions - ssSubjects;

  const dfConditions = kConditions - 1;
  const dfSubjects = nSubjects - 1;
  const dfError = dfConditions * dfSubjects;

  const msConditions = ssConditions / dfConditions;
  const msError = ssError / dfError;
  const F = msConditions / msError;

  return {
    ssConditions,
    ssSubjects,
    ssError,
    dfConditions,
    dfSubjects,
    dfError,
    msConditions,
    msError,
    F,
    pValue: 1 - jStat.centralF.cdf(F, dfConditions, dfError),
    etaSquared: ssConditions / (ssConditions + ssError),
  };
}
