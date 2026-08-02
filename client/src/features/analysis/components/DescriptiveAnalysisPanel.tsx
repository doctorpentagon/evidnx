import { useMemo, useState } from "react";
import { BarChart2, BookOpen, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AiPanel } from "@/components/ui/AiPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DatasetFull } from "@/features/data/types/dataset";
import { useRunAnalysis } from "../hooks/useAnalysis";
import type { AnalysisRecord } from "../types/analysis";

type MetricSummary = { n: number; mean: number; median: number; stdDev: number; min: number; max: number; q1: number; q3: number; skewness: number; kurtosis: number; confidenceInterval95: { lower: number; upper: number } };
type DescriptiveColumn = { name: string; type: "metric"; summary: MetricSummary } | { name: string; type: "nominal" | "ordinal"; frequency: { category: string | number; n: number; percent: number }[] };
const selectClass = "mt-1.5 min-h-11 w-full rounded-md border border-surface-border bg-white px-3 text-sm text-ink focus:border-brand-500";
const fmt = (value: number) => Number.isFinite(value) ? value.toFixed(2) : "—";

export function DescriptiveAnalysisPanel({ dataset, projectId }: { dataset: DatasetFull; projectId: number }) {
  const [columnId, setColumnId] = useState<number | null>(dataset.columns[0]?.id ?? null);
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  const run = useRunAnalysis(projectId);
  const column = dataset.columns.find((item) => item.id === columnId);
  const values = useMemo(() => dataset.rows.flatMap((row) => {
    if (!columnId) return [];
    const value = Number(row.data[String(columnId)]);
    return Number.isFinite(value) ? [value] : [];
  }), [dataset.rows, columnId]);

  const output = ((result?.results?.columns as DescriptiveColumn[] | undefined)?.[0]) ?? null;
  const chartData = useMemo(() => {
    if (!output) return [];
    if (output.type !== "metric") return output.frequency.map((item) => ({ label: String(item.category), value: item.n, percent: item.percent }));
    if (!values.length) return [];
    const bins = Math.max(5, Math.min(12, Math.ceil(Math.sqrt(values.length))));
    const low = Math.min(...values), high = Math.max(...values), width = high === low ? 1 : (high - low) / bins;
    return Array.from({ length: bins }, (_, index) => ({ start: low + index * width, end: low + (index + 1) * width, label: `${(low + index * width).toFixed(1)}–${(low + (index + 1) * width).toFixed(1)}`, value: 0 })).map((bin, index, all) => ({ ...bin, value: values.filter((value) => value >= bin.start && (index === all.length - 1 ? value <= bin.end : value < bin.end)).length }));
  }, [output, values]);

  async function calculate() {
    if (!columnId || !column) return;
    setResult(await run.mutateAsync({ datasetId: dataset.id, type: "descriptive", title: `Descriptive statistics: ${column.name}`, config: { columnIds: [columnId] } }));
  }

  const summary = output?.type === "metric" ? output.summary : null;
  const outliers = summary ? values.filter((value) => value < summary.q1 - 1.5 * (summary.q3 - summary.q1) || value > summary.q3 + 1.5 * (summary.q3 - summary.q1)).length : 0;
  return <Card className="overflow-hidden"><div className="border-b border-surface-border p-4 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-brand-600" /><h2 className="text-lg font-bold">Describe and inspect</h2></div><p className="mt-1 text-sm text-ink-muted">Understand shape, centre, spread, uncertainty, and unusual values before hypothesis testing.</p></div><Badge tone="ai">Foundational step</Badge></div></div>
    <div className="p-4 sm:p-6"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><label className="text-sm font-medium">Variable<select data-testid="descriptive-variable" className={selectClass} value={columnId ?? ""} onChange={(e) => { setColumnId(Number(e.target.value)); setResult(null); }}>{dataset.columns.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.measurementType}</option>)}</select></label><Button onClick={calculate} disabled={!columnId || run.isPending}>{run.isPending ? "Calculating…" : "Describe variable"}</Button></div>
      {output ? <div className="mt-6 grid gap-5 border-t border-surface-border pt-6 lg:grid-cols-2"><div><h3 className="font-semibold">{output.type === "metric" ? "Distribution" : "Category frequencies"}</h3><div className="mt-3 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: -10, right: 8, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Count" fill="#1466d6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="mt-2 text-xs text-ink-muted">Chart bins and category counts update directly from the selected dataset column.</p></div><div><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Statistical summary</h3><Badge tone="ai"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</Badge></div>
        {summary ? <><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{[["Valid n", summary.n], ["Mean", summary.mean], ["Median", summary.median], ["Std. deviation", summary.stdDev], ["Minimum", summary.min], ["Maximum", summary.max], ["Q1", summary.q1], ["Q3", summary.q3], ["Tukey outliers", outliers]].map(([label, value]) => <div key={String(label)} className="rounded-md bg-surface-canvas p-3"><p className="text-xs text-ink-muted">{String(label)}</p><p className="mt-1 font-semibold">{typeof value === "number" ? fmt(value) : value}</p></div>)}</div><div className="mt-3 rounded-md border border-surface-border p-3 text-sm"><p className="font-medium">95% confidence interval for the mean</p><p className="mt-1 text-ink-muted">{fmt(summary.confidenceInterval95.lower)} to {fmt(summary.confidenceInterval95.upper)}</p><p className="mt-2 text-xs text-ink-muted">This interval reflects sampling uncertainty under standard assumptions; it is not the range containing 95% of individual observations.</p></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-md bg-surface-canvas p-3"><p className="text-xs text-ink-muted">Skewness</p><p className="font-semibold">{fmt(summary.skewness)}</p></div><div className="rounded-md bg-surface-canvas p-3"><p className="text-xs text-ink-muted">Excess kurtosis</p><p className="font-semibold">{fmt(summary.kurtosis)}</p></div></div></> : <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-ink-muted"><th className="py-2">Category</th><th>Count</th><th>Percent</th></tr></thead><tbody>{output.type !== "metric" && output.frequency.map((item) => <tr key={String(item.category)} className="border-b border-surface-border"><td className="py-2 font-medium">{String(item.category)}</td><td>{item.n}</td><td>{item.percent.toFixed(1)}%</td></tr>)}</tbody></table></div>}
        {result?.interpretation ? <AiPanel className="mt-3" title="Guided summary"><p>{result.interpretation.headline}</p></AiPanel> : null}<p className="mt-3 flex items-start gap-2 text-xs text-ink-muted"><BookOpen className="h-4 w-4 shrink-0" />Descriptive statistics summarize this sample. They do not establish population effects, causation, or statistical significance.</p></div></div> : null}{run.error ? <p className="mt-3 rounded-md bg-error-50 p-3 text-sm text-error-600">{run.error.message}</p> : null}</div></Card>;
}
