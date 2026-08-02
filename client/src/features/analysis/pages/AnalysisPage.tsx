import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, BookOpen, CheckCircle2, ChevronRight, FlaskConical, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AiPanel } from "@/components/ui/AiPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCurrentProject } from "@/providers/CurrentProjectContext";
import { useDataset } from "@/features/data/hooks/useDataset";
import { useDatasets } from "@/features/data/hooks/useDatasets";
import { useAnalyses, useRecommendAnalysis, useRunAnalysis } from "../hooks/useAnalysis";
import type { AnalysisRecord, AnalysisType, TestRecommendation } from "../types/analysis";
import { RelationshipAnalysisPanel } from "../components/RelationshipAnalysisPanel";
import { DescriptiveAnalysisPanel } from "../components/DescriptiveAnalysisPanel";

const names: Record<AnalysisType, string> = {
  descriptive: "Descriptive statistics",
  independent_t_test: "Independent-samples t-test",
  mann_whitney: "Mann–Whitney U test",
  one_way_anova: "One-way ANOVA",
  kruskal_wallis: "Kruskal–Wallis test",
  correlation: "Correlation",
  linear_regression: "Linear regression",
};

const comparisonTypes: AnalysisType[] = ["independent_t_test", "mann_whitney", "one_way_anova", "kruskal_wallis"];

const selectClass = "min-h-11 w-full rounded-md border border-surface-border bg-white px-3 text-sm text-ink focus:border-brand-500";

function pLabel(value: number | null) {
  if (value === null) return "Not applicable";
  return value < 0.001 ? "p < .001" : `p = ${value.toFixed(3)}`;
}

function Assumption({ label, passed, evidence }: { label: string; passed: boolean; evidence: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-surface-border p-3">
      {passed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ai-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />}
      <div><p className="font-medium text-ink">{label}</p><p className="mt-0.5 text-sm text-ink-muted">{evidence}</p></div>
    </div>
  );
}

function keyResult(record: AnalysisRecord) {
  const result = record.results ?? {};
  const anova = (result.anova ?? {}) as Record<string, unknown>;
  const statistic = anova.F ?? result.H ?? result.t ?? result.U;
  const p = anova.pValue ?? result.pValue;
  const effect = anova.etaSquared ?? result.cohenD ?? result.effectSize;
  return { statistic, p, effect };
}

export function AnalysisPage() {
  const { currentProjectId } = useCurrentProject();
  const datasets = useDatasets(currentProjectId);
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const dataset = useDataset(datasetId ?? Number.NaN);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [outcomeId, setOutcomeId] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<TestRecommendation | null>(null);
  const [chosenType, setChosenType] = useState<AnalysisType | null>(null);
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  const [tone, setTone] = useState<"plain" | "academic" | "detailed" | "executive_summary">("plain");
  const recommend = useRecommendAnalysis();
  const run = useRunAnalysis(currentProjectId);
  const history = useAnalyses(currentProjectId);

  useEffect(() => {
    if (!datasetId && datasets.data?.length) setDatasetId(datasets.data[0].id);
  }, [datasetId, datasets.data]);

  useEffect(() => {
    setRecommendation(null); setChosenType(null); setResult(null);
    const columns = dataset.data?.columns ?? [];
    setGroupId(columns.find((c) => c.measurementType !== "metric")?.id ?? null);
    setOutcomeId(columns.find((c) => c.measurementType === "metric")?.id ?? null);
  }, [datasetId, dataset.data?.id]);

  const chartData = useMemo(() => {
    if (!dataset.data || !groupId || !outcomeId) return [];
    const groups = new Map<string, number[]>();
    dataset.data.rows.forEach((row) => {
      const group = row.data[String(groupId)];
      const value = Number(row.data[String(outcomeId)]);
      if (group === null || group === undefined || group === "" || Number.isNaN(value)) return;
      const key = String(group); groups.set(key, [...(groups.get(key) ?? []), value]);
    });
    return [...groups].map(([group, values]) => ({ group, mean: values.reduce((a, b) => a + b, 0) / values.length, n: values.length }));
  }, [dataset.data, groupId, outcomeId]);

  async function getRecommendation() {
    if (!datasetId || !groupId || !outcomeId) return;
    const value = await recommend.mutateAsync({ datasetId, groupingColumnId: groupId, outcomeColumnId: outcomeId });
    setRecommendation(value); setChosenType(value.recommendedTest); setResult(null);
  }

  async function runSelected() {
    if (!datasetId || !groupId || !outcomeId || !chosenType) return;
    const title = `${names[chosenType]}: ${recommendation?.outcomeVar ?? "Outcome"} by ${recommendation?.groupVar ?? "Group"}`;
    const value = await run.mutateAsync({ datasetId, type: chosenType, title, config: { groupingColumnId: groupId, outcomeColumnId: outcomeId } });
    setResult(value);
  }

  if (!currentProjectId) return <Card className="p-6"><p className="font-semibold">Choose a project from Dashboard to begin an analysis.</p></Card>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge tone="ai"><ShieldCheck className="h-3.5 w-3.5" /> Guided & auditable</Badge><h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Analysis workspace</h1><p className="mt-1 max-w-2xl text-ink-muted">Select the question in your data. EvidNX checks the evidence, explains why a method fits, computes it, and teaches you how to report it.</p></div>
        <Badge>{history.data?.length ?? 0} saved analyses</Badge>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <div className="space-y-5">
          <Card className="p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-bold text-brand-700">1</span><div><h2 className="font-semibold">Define the comparison</h2><p className="text-sm text-ink-muted">For this first complete workflow: compare one numeric outcome across categories.</p></div></div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">Dataset<select className={`${selectClass} mt-1.5`} value={datasetId ?? ""} onChange={(e) => setDatasetId(Number(e.target.value))}>{datasets.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Grouping variable<select className={`${selectClass} mt-1.5`} value={groupId ?? ""} onChange={(e) => { setGroupId(Number(e.target.value)); setRecommendation(null); }}><option value="">Choose a category</option>{dataset.data?.columns.filter((c) => c.measurementType !== "metric").map((c) => <option key={c.id} value={c.id}>{c.name} · {c.measurementType}</option>)}</select></label>
              <label className="text-sm font-medium">Numeric outcome<select className={`${selectClass} mt-1.5`} value={outcomeId ?? ""} onChange={(e) => { setOutcomeId(Number(e.target.value)); setRecommendation(null); }}><option value="">Choose an outcome</option>{dataset.data?.columns.filter((c) => c.measurementType === "metric").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center"><Button onClick={getRecommendation} disabled={!datasetId || !groupId || !outcomeId || recommend.isPending}>{recommend.isPending ? "Checking evidence…" : "Recommend a method"}<ChevronRight className="h-4 w-4" /></Button><p className="text-xs text-ink-muted">No AI guesswork: routing uses variable types, group count, Shapiro–Wilk, and Levene’s test.</p></div>
          </Card>

          {recommendation ? <Card className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Recommended method</p><h2 className="mt-1 text-xl font-bold">{names[recommendation.recommendedTest]}{recommendation.variant ? ` (${recommendation.variant})` : ""}</h2></div><Badge tone={recommendation.parametric ? "brand" : "ai"}>{recommendation.parametric ? "Parametric" : "Non-parametric"}</Badge></div>
            <AiPanel title="Why this method"><p>{recommendation.reasoning}</p></AiPanel>
            <h3 className="mb-2 mt-5 font-semibold">Assumption verdicts</h3><div className="grid gap-3 md:grid-cols-2">{recommendation.normalityByGroup.map((item) => <Assumption key={item.group} label={`Normality · ${item.group}`} passed={item.normal} evidence={`${pLabel(item.pValue)} — ${item.normal ? "no clear departure from normality" : "normality concern detected"}.`} />)}<Assumption label="Equal variances · Levene’s test" passed={recommendation.equalVariances !== false} evidence={`${pLabel(recommendation.leveneP)} — ${recommendation.equalVariances === null ? "not required" : recommendation.equalVariances ? "variance assumption is acceptable" : "variances differ; use a robust alternative"}.`} /></div>
            <details className="mt-4 rounded-md bg-surface-canvas p-3 text-sm"><summary className="cursor-pointer font-medium">Methods ruled out and why</summary><ul className="mt-2 space-y-2 text-ink-muted">{recommendation.alternativesRuledOut.map((item) => <li key={item.test}><strong className="text-ink">{item.test}:</strong> {item.reason}</li>)}</ul></details>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-sm font-medium">Method to run<select className={`${selectClass} mt-1.5`} value={chosenType ?? ""} onChange={(e) => setChosenType(e.target.value as AnalysisType)}>{comparisonTypes.map((value) => <option key={value} value={value}>{names[value]}</option>)}</select></label><Button className="sm:self-end" onClick={runSelected} disabled={!chosenType || run.isPending}><FlaskConical className="h-4 w-4" />{run.isPending ? "Computing…" : "Run analysis"}</Button></div>
            {chosenType !== recommendation.recommendedTest ? <p className="mt-2 text-xs text-warning-600">You overrode the recommended method. EvidNX will preserve that choice in the saved analysis.</p> : null}
          </Card> : null}

          {result?.interpretation ? <Card className="overflow-hidden"><div className="border-b border-surface-border p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-ai-700">Completed and saved</p><h2 className="mt-1 text-xl font-bold">{result.title}</h2></div><Badge tone="ai"><CheckCircle2 className="h-3.5 w-3.5" /> Computed</Badge></div></div><div className="grid gap-0 lg:grid-cols-2"><div className="border-b border-surface-border p-4 sm:p-6 lg:border-b-0 lg:border-r"><h3 className="mb-3 font-semibold">Observed group means</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: -15, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="group" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(value: number) => value.toFixed(2)} /><Bar dataKey="mean" fill="#1466d6" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="mt-2 text-xs text-ink-muted">This chart updates from the selected dataset values. Error bars and uncertainty intervals are the next validation increment.</p></div><div className="p-4 sm:p-6"><h3 className="font-semibold">Key output</h3>{(() => { const key = keyResult(result); const metrics: Array<[string, unknown]> = [["Statistic", key.statistic], ["p-value", key.p], ["Effect", key.effect]]; return <div className="mt-3 grid grid-cols-3 gap-2">{metrics.map(([label, value]) => <div key={label} className="rounded-md bg-surface-canvas p-3"><p className="text-xs text-ink-muted">{label}</p><p className="mt-1 font-semibold">{typeof value === "number" ? value.toFixed(3) : "—"}</p></div>)}</div>; })()}<div className="mt-5 flex flex-wrap gap-2">{(["plain", "academic", "detailed", "executive_summary"] as const).map((item) => <button key={item} onClick={() => setTone(item)} className={`min-h-10 rounded-full px-3 text-xs font-medium ${tone === item ? "bg-brand-600 text-white" : "bg-surface-canvas text-ink-muted"}`}>{item.replace("_", " ")}</button>)}</div><AiPanel className="mt-3" title="Guided interpretation"><p>{result.interpretation.narrative[tone]}</p></AiPanel><p className="mt-3 flex items-start gap-2 text-xs text-ink-muted"><BookOpen className="h-4 w-4 shrink-0" />Generated from the computed statistics using deterministic reporting rules. Review design, sampling, and domain context before publication.</p></div></div></Card> : null}
        </div>

        <aside className="space-y-5"><Card className="p-4"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-brand-600" /><h2 className="font-semibold">Live data preview</h2></div><dl className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-surface-canvas p-2"><dt className="text-xs text-ink-muted">Rows</dt><dd className="font-semibold">{dataset.data?.rows.length ?? 0}</dd></div><div className="rounded-md bg-surface-canvas p-2"><dt className="text-xs text-ink-muted">Groups</dt><dd className="font-semibold">{chartData.length}</dd></div><div className="rounded-md bg-surface-canvas p-2"><dt className="text-xs text-ink-muted">Variables</dt><dd className="font-semibold">{dataset.data?.columns.length ?? 0}</dd></div></dl><div className="mt-4 space-y-2">{chartData.slice(0, 6).map((item) => <div key={item.group} className="flex justify-between text-sm"><span className="truncate text-ink-muted">{item.group}</span><span className="ml-3 font-medium">M {item.mean.toFixed(2)} · n {item.n}</span></div>)}</div></Card><Card className="p-4"><h2 className="font-semibold">Recent analyses</h2><div className="mt-3 space-y-3">{history.data?.slice(0, 5).map((item) => <button key={item.id} onClick={() => setResult(item)} className="block min-h-11 w-full rounded-md border border-surface-border p-3 text-left hover:border-brand-200"><p className="line-clamp-2 text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-ink-muted">{item.status} · {new Date(item.createdAt).toLocaleDateString()}</p></button>)}{!history.data?.length ? <p className="text-sm text-ink-muted">Your completed analyses will appear here.</p> : null}</div></Card></aside>
      </div>
      {dataset.data ? <DescriptiveAnalysisPanel key={`descriptive-${dataset.data.id}`} dataset={dataset.data} projectId={currentProjectId} /> : null}
      {dataset.data ? <RelationshipAnalysisPanel key={`relationships-${dataset.data.id}`} dataset={dataset.data} projectId={currentProjectId} /> : null}
      {(recommend.error || run.error) ? <div className="rounded-md border border-error-100 bg-error-50 p-3 text-sm text-error-600">{(recommend.error ?? run.error)?.message}</div> : null}
    </div>
  );
}
