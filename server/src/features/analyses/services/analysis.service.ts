import { datasetRepository } from "../../datasets/repositories/dataset.repository.js";
import { datasetService } from "../../datasets/services/dataset.service.js";
import { AppError } from "../../../shared/errors.js";
import { describe, frequencyTable } from "../../../shared/stats/descriptive.js";
import { oneSampleTTest, independentTTest, pairedTTest } from "../../../shared/stats/tTest.js";
import { oneWayAnova, bonferroniPostHoc, scheffePostHoc, twoWayAnova, repeatedMeasuresAnova } from "../../../shared/stats/anova.js";
import { chiSquareTest } from "../../../shared/stats/chiSquare.js";
import { pearsonCorrelation, spearmanCorrelation, kendallTau, correlationMatrix } from "../../../shared/stats/correlation.js";
import { mannWhitneyU, wilcoxonSignedRank, kruskalWallis, friedmanTest } from "../../../shared/stats/nonparametric.js";
import { linearRegression, logisticRegression } from "../../../shared/stats/regression.js";
import { cronbachAlpha } from "../../../shared/stats/reliability.js";
import { runPCA } from "../../../shared/stats/pca.js";
import { runKMeans } from "../../../shared/stats/cluster.js";
import { ancova } from "../../../shared/stats/ancova.js";
import { testModeration, testMediation } from "../../../shared/stats/mediationModeration.js";
import { recommendGroupComparisonTest } from "../../../shared/stats/testRouter.js";
import { checkEqualVariances, checkMulticollinearity, checkNormality } from "./assumptions.service.js";
import * as interpret from "./interpretation.service.js";
import { analysisRepository } from "../repositories/analysis.repository.js";
import type { CreateAnalysisInput, RecommendTestInput } from "../dto/analysis.dto.js";

async function columnName(columnId: number): Promise<string> {
  const col = await datasetRepository.getColumn(columnId);
  if (!col) throw AppError.notFound("Column", columnId);
  return col.name;
}

async function numericValues(datasetId: number, columnId: number): Promise<number[]> {
  return datasetService.getNumericColumnValues(datasetId, columnId);
}

async function pairedNumericRows(datasetId: number, columnIds: number[]): Promise<number[][]> {
  const rows = await datasetRepository.getRows(datasetId);
  const keys = columnIds.map(String);
  return rows
    .map((r) => keys.map((k) => Number(r.data[k])))
    .filter((row) => row.every((v) => !Number.isNaN(v)));
}

async function groupedNumeric(datasetId: number, groupingColumnId: number, outcomeColumnId: number) {
  const rows = await datasetRepository.getRows(datasetId);
  const gKey = String(groupingColumnId);
  const oKey = String(outcomeColumnId);
  const byGroup = new Map<string, number[]>();
  for (const row of rows) {
    const g = row.data[gKey];
    const v = Number(row.data[oKey]);
    if (g === null || g === undefined || g === "" || Number.isNaN(v)) continue;
    const key = String(g);
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(v);
  }
  return [...byGroup.entries()].map(([label, values]) => ({ label, values }));
}

async function pairedCategorical(datasetId: number, colA: number, colB: number) {
  const rows = await datasetRepository.getRows(datasetId);
  const keyA = String(colA);
  const keyB = String(colB);
  const a: string[] = [];
  const b: string[] = [];
  for (const row of rows) {
    const va = row.data[keyA];
    const vb = row.data[keyB];
    if (va === null || va === undefined || va === "" || vb === null || vb === undefined || vb === "") continue;
    a.push(String(va));
    b.push(String(vb));
  }
  return { a, b };
}

export const analysisService = {
  async listByProject(projectId: number) {
    return analysisRepository.findByProject(projectId);
  },

  async listByDataset(datasetId: number) {
    return analysisRepository.findByDataset(datasetId);
  },

  async getById(id: number) {
    const analysis = await analysisRepository.findById(id);
    if (!analysis) throw AppError.notFound("Analysis", id);
    return analysis;
  },

  async remove(id: number) {
    const analysis = await analysisRepository.findById(id);
    if (!analysis) throw AppError.notFound("Analysis", id);
    await analysisRepository.remove(id);
  },

  async recommendTest(input: RecommendTestInput) {
    const groups = await groupedNumeric(input.datasetId, input.groupingColumnId, input.outcomeColumnId);
    if (groups.length < 2) {
      throw AppError.badRequest("The grouping variable needs at least two categories with data to compare.");
    }
    const outcomeVar = await columnName(input.outcomeColumnId);
    const groupVar = await columnName(input.groupingColumnId);
    const recommendation = recommendGroupComparisonTest(groups, { paired: input.paired });
    return { ...recommendation, outcomeVar, groupVar, groupCount: groups.length };
  },

  /** Runs the requested analysis end-to-end: compute -> check assumptions
   * where applicable -> generate interpretation -> persist. Returns the
   * saved, completed analysis row. */
  async run(input: CreateAnalysisInput) {
    const created = await analysisRepository.create({
      projectId: (await this.datasetProjectId(input.datasetId)),
      datasetId: input.datasetId,
      type: input.type,
      title: input.title,
      config: input.config,
    });

    try {
      const { results, assumptions, interpretation } = await this.compute(input.datasetId, input.type, input.config);
      return analysisRepository.complete(created.id, results, assumptions, interpretation as unknown as Record<string, unknown>);
    } catch (err) {
      await analysisRepository.markFailed(created.id, err instanceof Error ? err.message : "Analysis failed.");
      throw err instanceof AppError ? err : AppError.badRequest(err instanceof Error ? err.message : "Analysis failed.");
    }
  },

  async datasetProjectId(datasetId: number): Promise<number> {
    const dataset = await datasetRepository.findById(datasetId);
    if (!dataset) throw AppError.notFound("Dataset", datasetId);
    return dataset.projectId;
  },

  async compute(
    datasetId: number,
    type: CreateAnalysisInput["type"],
    config: Record<string, unknown>,
  ): Promise<{ results: Record<string, unknown>; assumptions: Record<string, unknown> | null; interpretation: unknown }> {
    switch (type) {
      case "descriptive": {
        const columnIds = config.columnIds as number[];
        if (!Array.isArray(columnIds) || columnIds.length < 1) {
          throw AppError.badRequest("Descriptive statistics require at least one variable.");
        }
        type DescriptiveColumn =
          | { columnId: number; name: string; type: "metric"; summary: ReturnType<typeof describe> }
          | { columnId: number; name: string; type: "nominal" | "ordinal"; frequency: ReturnType<typeof frequencyTable> };

        const perColumn: DescriptiveColumn[] = await Promise.all(
          columnIds.map(async (id) => {
            const col = await datasetRepository.getColumn(id);
            if (!col) throw AppError.notFound("Column", id);
            if (col.measurementType === "metric") {
              const values = await numericValues(datasetId, id);
              if (values.length < 2) throw AppError.badRequest(`${col.name} needs at least two numeric observations.`);
              return { columnId: id, name: col.name, type: "metric" as const, summary: describe(values) };
            }
            const values = await datasetService.getColumnValues(datasetId, id);
            return { columnId: id, name: col.name, type: col.measurementType, frequency: frequencyTable(values) };
          }),
        );
        return {
          results: { columns: perColumn },
          assumptions: null,
          interpretation: interpret.genericInterpretation(
            "descriptive statistics",
            perColumn.map((c) => (c.type === "metric" ? `${c.name}: mean = ${c.summary.mean.toFixed(2)}, SD = ${c.summary.stdDev.toFixed(2)} (n = ${c.summary.n}).` : `${c.name}: ${c.frequency.length} categories observed.`)),
          ),
        };
      }

      case "one_sample_t_test": {
        const { columnId, testValue } = config as { columnId: number; testValue: number };
        const values = await numericValues(datasetId, columnId);
        const varName = await columnName(columnId);
        const result = oneSampleTTest(values, testValue);
        return {
          results: { variable: varName, testValue, n: values.length, ...result },
          assumptions: { normality: checkNormality(varName, values) },
          interpretation: interpret.genericInterpretation(
            "one-sample t-test",
            [`The average ${varName} (${describe(values).mean.toFixed(2)}) is ${result.pValue < 0.05 ? "significantly different from" : "not significantly different from"} the test value of ${testValue} (t(${result.df}) = ${result.t.toFixed(2)}, p ${result.pValue < 0.001 ? "< .001" : `= ${result.pValue.toFixed(3)}`}).`],
          ),
        };
      }

      case "independent_t_test":
      case "mann_whitney": {
        const { groupingColumnId, outcomeColumnId } = config as { groupingColumnId: number; outcomeColumnId: number };
        const groups = await groupedNumeric(datasetId, groupingColumnId, outcomeColumnId);
        if (groups.length !== 2) throw AppError.badRequest("This test requires exactly two groups.");
        const outcomeVar = await columnName(outcomeColumnId);
        const groupVar = await columnName(groupingColumnId);
        const assumptions = {
          normalityGroup1: checkNormality(groups[0].label, groups[0].values),
          normalityGroup2: checkNormality(groups[1].label, groups[1].values),
          equalVariances: checkEqualVariances(groups.map((g) => g.values)),
        };

        if (type === "mann_whitney") {
          const result = mannWhitneyU(groups[0].values, groups[1].values);
          return {
            results: { outcomeVar, groupVar, ...result },
            assumptions,
            interpretation: interpret.genericInterpretation("Mann-Whitney U test", [
              `${groups[0].label} (mean rank = ${result.group1.meanRank.toFixed(1)}) vs. ${groups[1].label} (mean rank = ${result.group2.meanRank.toFixed(1)}) on ${outcomeVar}: U = ${result.U.toFixed(1)}, p ${result.pValue < 0.001 ? "< .001" : `= ${result.pValue.toFixed(3)}`}.`,
            ]),
          };
        }

        const result = independentTTest(groups[0].values, groups[1].values);
        const useVar = assumptions.equalVariances.verdict === "met" ? result.equalVariance : result.welch;
        return {
          results: { outcomeVar, groupVar, ...result },
          assumptions,
          interpretation: interpret.interpretIndependentTTest({
            outcomeVar,
            groupVar,
            group1: { label: groups[0].label, n: result.group1.n, mean: result.group1.mean },
            group2: { label: groups[1].label, n: result.group2.n, mean: result.group2.mean },
            t: useVar.t,
            df: useVar.df,
            pValue: useVar.pValue,
            cohenD: useVar.cohenD,
            effectSizeLabel: useVar.effectSizeLabel,
          }),
        };
      }

      case "paired_t_test":
      case "wilcoxon": {
        const { beforeColumnId, afterColumnId } = config as { beforeColumnId: number; afterColumnId: number };
        const pairs = await pairedNumericRows(datasetId, [beforeColumnId, afterColumnId]);
        const before = pairs.map((p) => p[0]);
        const after = pairs.map((p) => p[1]);
        const beforeVar = await columnName(beforeColumnId);
        const afterVar = await columnName(afterColumnId);
        const diffs = before.map((b, i) => after[i] - b);
        const assumptions = { normalityOfDifferences: checkNormality("Differences", diffs) };

        if (type === "wilcoxon") {
          const result = wilcoxonSignedRank(before, after);
          return {
            results: { beforeVar, afterVar, ...result },
            assumptions,
            interpretation: interpret.genericInterpretation("Wilcoxon signed-rank test", [
              `Comparing ${beforeVar} to ${afterVar}: W = ${result.W.toFixed(1)}, p ${result.pValue < 0.001 ? "< .001" : `= ${result.pValue.toFixed(3)}`}.`,
            ]),
          };
        }

        const result = pairedTTest(before, after);
        return {
          results: { beforeVar, afterVar, n: before.length, ...result },
          assumptions,
          interpretation: interpret.genericInterpretation("paired t-test", [
            `The average change from ${beforeVar} to ${afterVar} is ${result.meanDifference.toFixed(2)}, which is ${result.pValue < 0.05 ? "statistically significant" : "not statistically significant"} (t(${result.df}) = ${result.t.toFixed(2)}, p ${result.pValue < 0.001 ? "< .001" : `= ${result.pValue.toFixed(3)}`}).`,
          ]),
        };
      }

      case "one_way_anova":
      case "kruskal_wallis": {
        const { groupingColumnId, outcomeColumnId } = config as { groupingColumnId: number; outcomeColumnId: number };
        const grouped = await groupedNumeric(datasetId, groupingColumnId, outcomeColumnId);
        const outcomeVar = await columnName(outcomeColumnId);
        const groupVar = await columnName(groupingColumnId);
        const assumptions = {
          normality: grouped.map((g) => checkNormality(g.label, g.values)),
          equalVariances: checkEqualVariances(grouped.map((g) => g.values)),
        };

        if (type === "kruskal_wallis") {
          const result = kruskalWallis(grouped);
          return {
            results: { outcomeVar, groupVar, ...result },
            assumptions,
            interpretation: interpret.genericInterpretation("Kruskal-Wallis test", [
              `Comparing ${outcomeVar} across ${groupVar}: H(${result.df}) = ${result.H.toFixed(2)}, p ${result.pValue < 0.001 ? "< .001" : `= ${result.pValue.toFixed(3)}`}.`,
            ]),
          };
        }

        const anovaResult = oneWayAnova(grouped);
        const bonferroni = bonferroniPostHoc(grouped, anovaResult);
        const scheffe = scheffePostHoc(grouped, anovaResult);
        return {
          results: { outcomeVar, groupVar, anova: anovaResult, postHoc: { bonferroni, scheffe } },
          assumptions,
          interpretation: interpret.interpretAnova({
            outcomeVar,
            groupVar,
            F: anovaResult.F,
            dfBetween: anovaResult.dfBetween,
            dfWithin: anovaResult.dfWithin,
            pValue: anovaResult.pValue,
            etaSquared: anovaResult.etaSquared,
            etaSquaredLabel: anovaResult.etaSquaredLabel,
            groups: anovaResult.groups,
          }),
        };
      }

      case "two_way_anova": {
        const { factorAColumnId, factorBColumnId, outcomeColumnId } = config as {
          factorAColumnId: number;
          factorBColumnId: number;
          outcomeColumnId: number;
        };
        const rows = await datasetRepository.getRows(datasetId);
        const aKey = String(factorAColumnId);
        const bKey = String(factorBColumnId);
        const oKey = String(outcomeColumnId);
        const data = rows
          .map((r) => ({ factorA: String(r.data[aKey]), factorB: String(r.data[bKey]), value: Number(r.data[oKey]) }))
          .filter((d) => d.factorA !== "null" && d.factorB !== "null" && !Number.isNaN(d.value));
        const factorAName = await columnName(factorAColumnId);
        const factorBName = await columnName(factorBColumnId);
        const result = twoWayAnova(data, factorAName, factorBName);
        return {
          results: { outcomeVar: await columnName(outcomeColumnId), ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("two-way ANOVA", [
            `${factorAName}: F(${result.factorA.df}, ${result.dfWithin}) = ${result.factorA.F.toFixed(2)}, p ${result.factorA.pValue < 0.001 ? "< .001" : `= ${result.factorA.pValue.toFixed(3)}`}.`,
            `${factorBName}: F(${result.factorB.df}, ${result.dfWithin}) = ${result.factorB.F.toFixed(2)}, p ${result.factorB.pValue < 0.001 ? "< .001" : `= ${result.factorB.pValue.toFixed(3)}`}.`,
            `Interaction: F(${result.interaction.df}, ${result.dfWithin}) = ${result.interaction.F.toFixed(2)}, p ${result.interaction.pValue < 0.001 ? "< .001" : `= ${result.interaction.pValue.toFixed(3)}`}.`,
          ]),
        };
      }

      case "repeated_measures_anova": {
        const { conditionColumnIds } = config as { conditionColumnIds: number[] };
        const dataBySubject = await pairedNumericRows(datasetId, conditionColumnIds);
        const result = repeatedMeasuresAnova(dataBySubject);
        return {
          results: { ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("repeated-measures ANOVA", [
            `F(${result.dfConditions}, ${result.dfError}) = ${result.F.toFixed(2)}, p ${result.pValue < 0.001 ? "< .001" : `= ${result.pValue.toFixed(3)}`}.`,
          ]),
        };
      }

      case "chi_square": {
        const { rowColumnId, colColumnId } = config as { rowColumnId: number; colColumnId: number };
        const { a, b } = await pairedCategorical(datasetId, rowColumnId, colColumnId);
        const rowVar = await columnName(rowColumnId);
        const colVar = await columnName(colColumnId);
        const result = chiSquareTest(a, b);
        return {
          results: { rowVar, colVar, ...result },
          assumptions: null,
          interpretation: interpret.interpretChiSquare({ rowVar, colVar, statistic: result.statistic, df: result.df, pValue: result.pValue, cramersV: result.cramersV }),
        };
      }

      case "correlation": {
        const { columnIds, method } = config as { columnIds: number[]; method: "pearson" | "spearman" | "kendall" };
        if (!Array.isArray(columnIds) || columnIds.length < 2) {
          throw AppError.badRequest("Correlation requires at least two numeric variables.");
        }
        const names = await Promise.all(columnIds.map(columnName));
        const rows = await datasetRepository.getRows(datasetId);
        const completeRows = rows
          .map((row) => columnIds.map((id) => Number(row.data[String(id)])))
          .filter((values) => values.every((value) => Number.isFinite(value)));
        if (completeRows.length < 3) {
          throw AppError.badRequest("Correlation requires at least three complete paired observations.");
        }
        const columns = columnIds.map((id, i) => ({
          name: names[i],
          values: completeRows.map((row) => row[i]),
        }));

        if (columnIds.length === 2) {
          const fn = method === "spearman" ? spearmanCorrelation : method === "kendall" ? kendallTau : pearsonCorrelation;
          const result = fn(columns[0].values, columns[1].values);
          return {
            results: { varX: names[0], varY: names[1], ...result },
            assumptions: null,
            interpretation: interpret.interpretCorrelation({ varX: names[0], varY: names[1], r: result.r, pValue: result.pValue, method: result.method, effectSizeLabel: result.effectSizeLabel }),
          };
        }

        const matrix = correlationMatrix(columns, method === "kendall" ? "pearson" : method);
        return {
          results: { variables: names, matrix },
          assumptions: null,
          interpretation: interpret.genericInterpretation("correlation matrix", [`Correlation matrix computed for ${names.join(", ")}.`]),
        };
      }

      case "linear_regression": {
        const { dvColumnId, ivColumnIds } = config as { dvColumnId: number; ivColumnIds: number[] };
        if (!Array.isArray(ivColumnIds) || ivColumnIds.length < 1) {
          throw AppError.badRequest("Linear regression requires at least one predictor.");
        }
        const rows = await datasetRepository.getRows(datasetId);
        const dvKey = String(dvColumnId);
        const ivKeys = ivColumnIds.map(String);
        const complete = rows
          .map((r) => ({ dv: Number(r.data[dvKey]), ivs: ivKeys.map((k) => Number(r.data[k])) }))
          .filter((r) => !Number.isNaN(r.dv) && r.ivs.every((v) => !Number.isNaN(v)));

        if (complete.length <= ivColumnIds.length + 1) {
          throw AppError.badRequest(`Linear regression needs more than ${ivColumnIds.length + 1} complete observations for this model.`);
        }

        const dvName = await columnName(dvColumnId);
        const ivNames = await Promise.all(ivColumnIds.map(columnName));
        const result = linearRegression(complete.map((r) => r.ivs), complete.map((r) => r.dv), ivNames);
        const assumptions = { multicollinearity: checkMulticollinearity(result.coefficients.filter((c) => c.name !== "Intercept").map((c) => ({ name: c.name, vif: c.vif }))) };

        return {
          results: { dvName, ...result },
          assumptions,
          interpretation: interpret.interpretRegression({
            dvName,
            r2: result.r2,
            adjR2: result.adjR2,
            F: result.F,
            dfModel: result.dfModel,
            dfResidual: result.dfResidual,
            pValue: result.pValue,
            coefficients: result.coefficients,
          }),
        };
      }

      case "logistic_regression": {
        const { dvColumnId, ivColumnIds } = config as { dvColumnId: number; ivColumnIds: number[] };
        const rows = await datasetRepository.getRows(datasetId);
        const dvKey = String(dvColumnId);
        const ivKeys = ivColumnIds.map(String);
        const complete = rows
          .map((r) => ({ dv: Number(r.data[dvKey]), ivs: ivKeys.map((k) => Number(r.data[k])) }))
          .filter((r) => (r.dv === 0 || r.dv === 1) && r.ivs.every((v) => !Number.isNaN(v)));

        const dvName = await columnName(dvColumnId);
        const ivNames = await Promise.all(ivColumnIds.map(columnName));
        const result = logisticRegression(complete.map((r) => r.ivs), complete.map((r) => r.dv), ivNames);

        return {
          results: { dvName, ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("logistic regression", [
            `Model predicts ${dvName} with ${(result.accuracy * 100).toFixed(0)}% classification accuracy (McFadden's R² = ${result.mcFaddenR2.toFixed(2)}).`,
            ...result.coefficients.filter((c) => c.name !== "Intercept").map((c) => `${c.name}: odds ratio = ${c.oddsRatio.toFixed(2)}, p ${c.pValue < 0.001 ? "< .001" : `= ${c.pValue.toFixed(3)}`}.`),
          ]),
        };
      }

      case "ancova": {
        const { groupColumnId, covariateColumnId, dvColumnId } = config as {
          groupColumnId: number;
          covariateColumnId: number;
          dvColumnId: number;
        };
        const rows = await datasetRepository.getRows(datasetId);
        const gKey = String(groupColumnId);
        const cKey = String(covariateColumnId);
        const dKey = String(dvColumnId);
        const complete = rows
          .map((r) => ({ group: String(r.data[gKey]), covariate: Number(r.data[cKey]), dv: Number(r.data[dKey]) }))
          .filter((r) => r.group !== "null" && !Number.isNaN(r.covariate) && !Number.isNaN(r.dv));

        const result = ancova(complete.map((r) => r.group), complete.map((r) => r.covariate), complete.map((r) => r.dv));
        return {
          results: { ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("ANCOVA", [
            `Group effect on ${await columnName(dvColumnId)}, controlling for ${await columnName(covariateColumnId)}: F(${result.groupEffect.df1}, ${result.groupEffect.df2}) = ${result.groupEffect.F.toFixed(2)}, p ${result.groupEffect.pValue < 0.001 ? "< .001" : `= ${result.groupEffect.pValue.toFixed(3)}`}.`,
          ]),
        };
      }

      case "moderation":
      case "mediation": {
        const { xColumnId, mColumnId, yColumnId } = config as { xColumnId: number; mColumnId: number; yColumnId: number };
        const rows = await datasetRepository.getRows(datasetId);
        const xKey = String(xColumnId);
        const mKey = String(mColumnId);
        const yKey = String(yColumnId);
        const complete = rows
          .map((r) => ({ x: Number(r.data[xKey]), m: Number(r.data[mKey]), y: Number(r.data[yKey]) }))
          .filter((r) => !Number.isNaN(r.x) && !Number.isNaN(r.m) && !Number.isNaN(r.y));

        if (type === "moderation") {
          const result = testModeration(complete.map((r) => r.x), complete.map((r) => r.m), complete.map((r) => r.y));
          return {
            results: { ...result },
            assumptions: null,
            interpretation: interpret.genericInterpretation("moderation analysis", [
              `Interaction effect: β = ${result.interaction.estimate.toFixed(2)}, p ${result.interaction.pValue < 0.001 ? "< .001" : `= ${result.interaction.pValue.toFixed(3)}`} - ${result.interaction.significant ? "the relationship does depend on the moderator." : "no evidence the relationship depends on the moderator."}`,
            ]),
          };
        }

        const result = testMediation(complete.map((r) => r.x), complete.map((r) => r.m), complete.map((r) => r.y));
        return {
          results: { ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("mediation analysis", [
            `Indirect effect through the mediator = ${result.indirectEffect.toFixed(3)} (Sobel z = ${result.sobelZ.toFixed(2)}, p ${result.sobelP < 0.001 ? "< .001" : `= ${result.sobelP.toFixed(3)}`}), accounting for ${(result.proportionMediated * 100).toFixed(0)}% of the total effect.`,
          ]),
        };
      }

      case "pca": {
        const { columnIds } = config as { columnIds: number[] };
        const names = await Promise.all(columnIds.map(columnName));
        const rows = await pairedNumericRows(datasetId, columnIds);
        const result = runPCA(names, rows);
        return {
          results: { ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("PCA", [
            `The first ${result.nComponentsFor80Percent} component(s) explain ${(result.cumulativeVariance[result.nComponentsFor80Percent - 1] * 100).toFixed(0)}% of the total variance.`,
          ]),
        };
      }

      case "reliability": {
        const { itemColumnIds } = config as { itemColumnIds: number[] };
        const names = await Promise.all(itemColumnIds.map(columnName));
        const rows = await pairedNumericRows(datasetId, itemColumnIds);
        const items = names.map((name, i) => ({ name, values: rows.map((r) => r[i]) }));
        const result = cronbachAlpha(items);
        return {
          results: { ...result },
          assumptions: null,
          interpretation: interpret.interpretReliability({ scaleName: names.join(" + "), alpha: result.cronbachAlpha, verdict: result.verdict, nItems: result.nItems }),
        };
      }

      case "cluster": {
        const { columnIds, k } = config as { columnIds: number[]; k: number };
        const names = await Promise.all(columnIds.map(columnName));
        const rows = await pairedNumericRows(datasetId, columnIds);
        const result = runKMeans(names, rows, k);
        return {
          results: { ...result },
          assumptions: null,
          interpretation: interpret.genericInterpretation("cluster analysis", [
            `Found ${k} clusters of sizes ${result.clusterSizes.join(", ")}.`,
          ]),
        };
      }

      default:
        throw AppError.badRequest(`Analysis type "${type}" is not supported.`);
    }
  },
};
