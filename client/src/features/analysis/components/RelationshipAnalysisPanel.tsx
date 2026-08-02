import { useMemo, useState } from "react";
import { Activity, BookOpen, CheckCircle2, GitBranch, TrendingUp } from "lucide-react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { AiPanel } from "@/components/ui/AiPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DatasetFull } from "@/features/data/types/dataset";
import { useRunAnalysis } from "../hooks/useAnalysis";
import type { AnalysisRecord } from "../types/analysis";

type Mode = "correlation" | "linear_regression";
type Tone = "plain" | "academic" | "detailed" | "executive_summary";
const selectClass = "mt-1.5 min-h-11 w-full rounded-md border border-surface-border bg-white px-3 text-sm text-ink focus:border-brand-500";
const format = (value: unknown, digits = 3) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";

export function RelationshipAnalysisPanel({ dataset, projectId }: { dataset: DatasetFull; projectId: number }) {
  const numeric = dataset.columns.filter((column) => column.measurementType === "metric");
  const [mode, setMode] = useState<Mode>("correlation");
  const [xId, setXId] = useState<number | null>(numeric[0]?.id ?? null);
  const [yId, setYId] = useState<number | null>(numeric[1]?.id ?? null);
  const [method, setMethod] = useState<"pearson" | "spearman" | "kendall">("pearson");
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  const [tone, setTone] = useState<Tone>("plain");
  const run = useRunAnalysis(projectId);
  const xName = numeric.find((column) => column.id === xId)?.name ?? "Predictor";
  const yName = numeric.find((column) => column.id === yId)?.name ?? "Outcome";
  const points = useMemo(() => dataset.rows.flatMap((row) => {
    if (!xId || !yId) return [];
    const x = Number(row.data[String(xId)]), y = Number(row.data[String(yId)]);
    return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
  }), [dataset.rows, xId, yId]);

  async function execute() {
    if (!xId || !yId || xId === yId) return;
    const correlation = mode === "correlation";
    setResult(await run.mutateAsync({ datasetId: dataset.id, type: mode,
      title: correlation ? `${method[0].toUpperCase()}${method.slice(1)} correlation: ${xName} and ${yName}` : `Linear regression: ${yName} predicted by ${xName}`,
      config: correlation ? { columnIds: [xId, yId], method } : { dvColumnId: yId, ivColumnIds: [xId] },
    }));
  }

  const values = result?.results ?? {};
  const coefficients = Array.isArray(values.coefficients) ? values.coefficients as Array<Record<string, unknown>> : [];
  return <Card className="overflow-hidden">
    <div className="border-b border-surface-border p-4 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-brand-600" /><h2 className="text-lg font-bold">Relationships and prediction</h2></div><p className="mt-1 text-sm text-ink-muted">Explore association first; use regression only when prediction matches your question and design.</p></div><Badge tone="brand">{points.length} complete pairs</Badge></div>
      <div className="mt-4 grid grid-cols-2 rounded-md bg-surface-canvas p-1"><button onClick={() => { setMode("correlation"); setResult(null); }} className={`min-h-11 rounded px-3 text-sm font-medium ${mode === "correlation" ? "bg-white text-brand-700 shadow-sm" : "text-ink-muted"}`}><Activity className="mr-1.5 inline h-4 w-4" />Correlation</button><button onClick={() => { setMode("linear_regression"); setResult(null); }} className={`min-h-11 rounded px-3 text-sm font-medium ${mode === "linear_regression" ? "bg-white text-brand-700 shadow-sm" : "text-ink-muted"}`}><TrendingUp className="mr-1.5 inline h-4 w-4" />Regression</button></div></div>
    <div className="p-4 sm:p-6">{numeric.length < 2 ? <AiPanel title="More numeric variables needed"><p>This dataset needs at least two metric variables. Confirm measurement levels in Data first.</p></AiPanel> : <><div className={`grid gap-4 ${mode === "correlation" ? "md:grid-cols-3" : "md:grid-cols-2"}`}><label className="text-sm font-medium">{mode === "correlation" ? "Horizontal variable" : "Predictor (X)"}<select className={selectClass} value={xId ?? ""} onChange={(e) => { setXId(Number(e.target.value)); setResult(null); }}>{numeric.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm font-medium">{mode === "correlation" ? "Vertical variable" : "Outcome (Y)"}<select className={selectClass} value={yId ?? ""} onChange={(e) => { setYId(Number(e.target.value)); setResult(null); }}>{numeric.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{mode === "correlation" ? <label className="text-sm font-medium">Coefficient<select className={selectClass} value={method} onChange={(e) => { setMethod(e.target.value as typeof method); setResult(null); }}><option value="pearson">Pearson · linear, continuous</option><option value="spearman">Spearman · monotonic/ranked</option><option value="kendall">Kendall · ordinal/small samples</option></select></label> : null}</div>{xId === yId ? <p className="mt-2 text-sm text-warning-600">Choose two different variables.</p> : null}<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><Button onClick={execute} disabled={!xId || !yId || xId === yId || run.isPending}>{run.isPending ? "Computing…" : mode === "correlation" ? "Calculate correlation" : "Fit regression model"}</Button><p className="text-xs text-ink-muted">Missing pairs are excluded row-by-row, never independently.</p></div></>}
      {result?.interpretation ? <div className="mt-6 grid gap-5 border-t border-surface-border pt-6 lg:grid-cols-2"><div><h3 className="font-semibold">Observed relationship</h3><div className="mt-3 h-72"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ left: 0, right: 14, bottom: 12 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" dataKey="x" name={xName} tick={{ fontSize: 11 }} label={{ value: xName, position: "insideBottom", offset: -8 }} /><YAxis type="number" dataKey="y" name={yName} tick={{ fontSize: 11 }} width={48} /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter data={points} fill="#1466d6" /></ScatterChart></ResponsiveContainer></div><p className="mt-2 text-xs text-ink-muted">Each mark is one complete row. Inspect curvature and outliers before trusting one coefficient.</p></div><div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Model output</h3><Badge tone="ai"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</Badge></div>
        {mode === "correlation" ? <div className="mt-3 grid grid-cols-3 gap-2">{[["Coefficient", values.r], ["p-value", values.pValue], ["n", values.n]].map(([label, value]) => <div key={String(label)} className="rounded-md bg-surface-canvas p-3"><p className="text-xs text-ink-muted">{String(label)}</p><p className="mt-1 font-semibold">{format(value)}</p></div>)}</div> : <><div className="mt-3 grid grid-cols-3 gap-2">{[["R²", values.r2], ["Adjusted R²", values.adjR2], ["Model p", values.pValue]].map(([label, value]) => <div key={String(label)} className="rounded-md bg-surface-canvas p-3"><p className="text-xs text-ink-muted">{String(label)}</p><p className="mt-1 font-semibold">{format(value)}</p></div>)}</div><div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-ink-muted"><th className="py-2">Term</th><th>Estimate</th><th>SE</th><th>p</th></tr></thead><tbody>{coefficients.map((c) => <tr key={String(c.name)} className="border-b border-surface-border"><td className="py-2 font-medium">{String(c.name)}</td><td>{format(c.estimate)}</td><td>{format(c.standardError)}</td><td>{format(c.pValue)}</td></tr>)}</tbody></table></div></>}
        <div className="mt-4 flex flex-wrap gap-2">{(["plain", "academic", "detailed", "executive_summary"] as Tone[]).map((item) => <button key={item} onClick={() => setTone(item)} className={`min-h-10 rounded-full px-3 text-xs font-medium ${tone === item ? "bg-brand-600 text-white" : "bg-surface-canvas text-ink-muted"}`}>{item.replace("_", " ")}</button>)}</div><AiPanel className="mt-3" title="Guided interpretation"><p>{result.interpretation.narrative[tone]}</p></AiPanel><p className="mt-3 flex items-start gap-2 text-xs text-ink-muted"><BookOpen className="h-4 w-4 shrink-0" />Association is not causation. Model estimates depend on sampling, specification, and assumptions.</p></div></div> : null}{run.error ? <p className="mt-3 rounded-md bg-error-50 p-3 text-sm text-error-600">{run.error.message}</p> : null}</div>
  </Card>;
}
