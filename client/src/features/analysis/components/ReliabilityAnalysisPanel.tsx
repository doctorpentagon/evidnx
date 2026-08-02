import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Gauge, Info } from "lucide-react";
import { AiPanel } from "@/components/ui/AiPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DatasetFull } from "@/features/data/types/dataset";
import { useRunAnalysis } from "../hooks/useAnalysis";
import type { AnalysisRecord } from "../types/analysis";

type ItemStat = { item: string; correctedItemTotalCorrelation: number; alphaIfDeleted: number | null };
const format = (value: number | null) => value === null || !Number.isFinite(value) ? "Not available" : value.toFixed(3);
const escapeCsv = (value: string | number | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function ReliabilityAnalysisPanel({ dataset, projectId }: { dataset: DatasetFull; projectId: number }) {
  const eligible = dataset.columns.filter((column) => column.valueType === "number");
  const [selected, setSelected] = useState<number[]>(eligible.map((column) => column.id));
  const [scaleName, setScaleName] = useState("Selected item scale");
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  const run = useRunAnalysis(projectId);
  const output = result?.results ?? {};
  const stats = Array.isArray(output.itemStats) ? output.itemStats as ItemStat[] : [];
  const alpha = typeof output.cronbachAlpha === "number" ? output.cronbachAlpha : null;
  const standardizedAlpha = typeof output.standardizedAlpha === "number" ? output.standardizedAlpha : null;
  const flagged = useMemo(() => stats.filter((item) => item.correctedItemTotalCorrelation < 0.3), [stats]);

  function toggle(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setResult(null);
  }

  async function calculate() {
    setResult(await run.mutateAsync({ datasetId: dataset.id, type: "reliability", title: `Reliability: ${scaleName.trim() || "Selected scale"}`, config: { itemColumnIds: selected } }));
  }

  function downloadCsv() {
    const rows = [
      ["EvidNX reliability analysis"], ["Scale", scaleName], ["Raw Cronbach alpha", alpha], ["Standardized alpha", standardizedAlpha], ["Verdict (raw alpha)", String(output.verdict ?? "")], ["Complete responses", Number(output.n ?? 0)], [],
      ["Item", "Corrected item-total correlation", "Alpha if item deleted"],
      ...stats.map((item) => [item.item, item.correctedItemTotalCorrelation, item.alphaIfDeleted]),
    ];
    const csv = rows.map((row) => row.map((cell) => escapeCsv(cell as string | number | null)).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${scaleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "scale"}-reliability.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <Card className="overflow-hidden"><div className="border-b border-surface-border p-4 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-brand-600" /><h2 className="text-lg font-bold">Scale reliability</h2></div><p className="mt-1 text-sm text-ink-muted">Check whether questionnaire items intended to measure one construct behave consistently.</p></div><Badge tone="brand">Cronbach’s alpha</Badge></div></div>
    <div className="p-4 sm:p-6"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]"><div><label className="text-sm font-medium">Scale name<input value={scaleName} onChange={(event) => setScaleName(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-surface-border px-3 text-sm" /></label><fieldset className="mt-4"><legend className="text-sm font-medium">Items measuring the same construct</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{eligible.map((column) => <label key={column.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${selected.includes(column.id) ? "border-brand-300 bg-brand-50" : "border-surface-border"}`}><input type="checkbox" checked={selected.includes(column.id)} onChange={() => toggle(column.id)} className="h-4 w-4 accent-brand-600" /><span><span className="block font-medium">{column.name}</span><span className="text-xs text-ink-muted">{column.measurementType}</span></span></label>)}</div></fieldset>{eligible.length < 2 ? <AiPanel className="mt-3" title="Not enough numeric items"><p>Add or correctly type at least two numeric scale items in Data.</p></AiPanel> : null}<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><Button onClick={calculate} disabled={selected.length < 2 || run.isPending}>{run.isPending ? "Checking reliability…" : "Calculate reliability"}</Button><p className="text-xs text-ink-muted">Uses complete responses across all selected items.</p></div></div>
        <AiPanel title="Before you calculate"><ul className="space-y-2 text-sm"><li>Only combine items designed to measure one underlying construct.</li><li>Reverse-score negatively worded items before calculating alpha.</li><li>A high alpha does not prove validity or one-dimensionality.</li></ul></AiPanel></div>
      {result ? <div className="mt-6 border-t border-surface-border pt-6"><div className="grid gap-4 sm:grid-cols-4"><div className="rounded-lg bg-surface-canvas p-4"><p className="text-xs text-ink-muted">Raw alpha</p><p className="mt-1 text-3xl font-bold text-brand-700">{alpha === null ? "—" : alpha.toFixed(3)}</p></div><div className="rounded-lg bg-surface-canvas p-4"><p className="text-xs text-ink-muted">Standardized alpha</p><p className="mt-2 text-lg font-semibold">{standardizedAlpha === null ? "—" : standardizedAlpha.toFixed(3)}</p></div><div className="rounded-lg bg-surface-canvas p-4"><p className="text-xs text-ink-muted">Raw-alpha band</p><p className="mt-2 text-lg font-semibold capitalize">{String(output.verdict ?? "—")}</p></div><div className="rounded-lg bg-surface-canvas p-4"><p className="text-xs text-ink-muted">Complete responses</p><p className="mt-2 text-lg font-semibold">{String(output.n ?? "—")}</p></div></div>
        {alpha !== null && standardizedAlpha !== null && Math.abs(alpha - standardizedAlpha) >= 0.1 ? <div className="mt-4 flex gap-3 rounded-md border border-warning-100 bg-warning-50 p-3 text-sm text-warning-600"><AlertTriangle className="h-5 w-5 shrink-0" /><p>Raw and standardized alpha differ substantially. The items may use different ranges or units. For questionnaire scales, confirm every item shares a comparable response scale before interpreting reliability.</p></div> : null}
        {flagged.length ? <div className="mt-4 flex gap-3 rounded-md border border-warning-100 bg-warning-50 p-3 text-sm text-warning-600"><AlertTriangle className="h-5 w-5 shrink-0" /><p>{flagged.length} item{flagged.length === 1 ? " has" : "s have"} corrected item-total correlation below .30. Check construct fit, coding direction, and wording before deleting anything.</p></div> : <div className="mt-4 flex gap-3 rounded-md bg-ai-50 p-3 text-sm text-ai-700"><CheckCircle2 className="h-5 w-5 shrink-0" /><p>No selected item has a corrected item-total correlation below .30.</p></div>}
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b text-left text-ink-muted"><th className="py-2">Item</th><th>Corrected item-total r</th><th>Alpha if deleted</th><th>Diagnostic</th></tr></thead><tbody>{stats.map((item) => <tr key={item.item} className="border-b border-surface-border"><td className="py-3 font-medium">{item.item}</td><td>{format(item.correctedItemTotalCorrelation)}</td><td>{format(item.alphaIfDeleted)}</td><td>{item.correctedItemTotalCorrelation < 0 ? <Badge tone="warning">Check reverse coding</Badge> : item.correctedItemTotalCorrelation < 0.3 ? <Badge tone="warning">Review item</Badge> : <Badge tone="ai">Consistent</Badge>}</td></tr>)}</tbody></table></div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex max-w-2xl items-start gap-2 text-xs text-ink-muted"><Info className="h-4 w-4 shrink-0" />Thresholds are conventions: below .60 poor, .60–.69 questionable, .70–.79 acceptable, .80–.89 good, and .90+ excellent. Interpret with item count and construct breadth.</p><Button variant="outline" onClick={downloadCsv}><Download className="h-4 w-4" />Download CSV</Button></div>
        {result.interpretation ? <AiPanel className="mt-4" title="Report-ready interpretation"><p>{result.interpretation.narrative.academic}</p></AiPanel> : null}</div> : null}{run.error ? <p className="mt-3 rounded-md bg-error-50 p-3 text-sm text-error-600">{run.error.message}</p> : null}</div></Card>;
}
