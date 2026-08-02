import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCreateIndex, useRecode } from "../hooks/useDataset";
import type { DatasetFull } from "../types/dataset";

export function TransformPanel({ dataset }: { dataset: DatasetFull }) {
  const recode = useRecode(dataset.id);
  const createIndex = useCreateIndex(dataset.id);

  const [recodeSourceId, setRecodeSourceId] = useState<number | null>(dataset.columns[0]?.id ?? null);
  const [recodeName, setRecodeName] = useState("");
  const [mappings, setMappings] = useState<{ from: string; to: string }[]>([{ from: "", to: "" }]);

  const [indexName, setIndexName] = useState("");
  const [indexMethod, setIndexMethod] = useState<"sum" | "mean">("mean");
  const [indexColumnIds, setIndexColumnIds] = useState<number[]>([]);

  const numericColumns = dataset.columns.filter((c) => c.valueType === "number");

  async function handleRecode() {
    if (!recodeSourceId || !recodeName.trim()) return;
    await recode.mutateAsync({
      sourceColumnId: recodeSourceId,
      newColumnName: recodeName.trim(),
      mappings: mappings.filter((m) => m.from.trim() !== "").map((m) => ({ kind: "value", from: m.from, to: m.to })),
    });
    setRecodeName("");
    setMappings([{ from: "", to: "" }]);
  }

  async function handleCreateIndex() {
    if (!indexName.trim() || indexColumnIds.length < 2) return;
    await createIndex.mutateAsync({ sourceColumnIds: indexColumnIds, newColumnName: indexName.trim(), method: indexMethod });
    setIndexName("");
    setIndexColumnIds([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <p className="font-semibold text-ink">Recode variable</p>
        <p className="text-helper text-ink-muted">Map values from an existing column into a new one.</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={recodeSourceId ?? ""}
            onChange={(e) => setRecodeSourceId(Number(e.target.value))}
            className="h-9 rounded-md border border-surface-border px-2 text-secondary"
          >
            {dataset.columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={recodeName}
            onChange={(e) => setRecodeName(e.target.value)}
            placeholder="New column name"
            className="h-9 rounded-md border border-surface-border px-2 text-secondary"
          />
        </div>
        <div className="flex flex-col gap-2">
          {mappings.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={m.from}
                onChange={(e) => setMappings((ms) => ms.map((mm, mi) => (mi === i ? { ...mm, from: e.target.value } : mm)))}
                placeholder="From value"
                className="h-9 w-32 rounded-md border border-surface-border px-2 text-secondary"
              />
              <span className="text-ink-muted">→</span>
              <input
                value={m.to}
                onChange={(e) => setMappings((ms) => ms.map((mm, mi) => (mi === i ? { ...mm, to: e.target.value } : mm)))}
                placeholder="To value"
                className="h-9 w-32 rounded-md border border-surface-border px-2 text-secondary"
              />
              <button onClick={() => setMappings((ms) => ms.filter((_, mi) => mi !== i))} className="text-ink-muted hover:text-error-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setMappings((ms) => [...ms, { from: "", to: "" }])}
            className="flex w-fit items-center gap-1 text-helper font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add mapping
          </button>
        </div>
        <Button size="sm" className="w-fit" disabled={!recodeSourceId || !recodeName.trim() || recode.isPending} onClick={handleRecode}>
          Create recoded column
        </Button>
        {recode.isSuccess ? <Badge tone="ai">Column added</Badge> : null}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <p className="font-semibold text-ink">Create index (composite score)</p>
        <p className="text-helper text-ink-muted">Combine two or more numeric columns into a sum or mean.</p>
        <div className="flex flex-wrap gap-2">
          {numericColumns.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 rounded-md border border-surface-border px-2 py-1 text-secondary">
              <input
                type="checkbox"
                checked={indexColumnIds.includes(c.id)}
                onChange={(e) =>
                  setIndexColumnIds((ids) => (e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id)))
                }
              />
              {c.name}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={indexName}
            onChange={(e) => setIndexName(e.target.value)}
            placeholder="New column name"
            className="h-9 rounded-md border border-surface-border px-2 text-secondary"
          />
          <select value={indexMethod} onChange={(e) => setIndexMethod(e.target.value as "sum" | "mean")} className="h-9 rounded-md border border-surface-border px-2 text-secondary">
            <option value="mean">Mean</option>
            <option value="sum">Sum</option>
          </select>
          <Button size="sm" disabled={!indexName.trim() || indexColumnIds.length < 2 || createIndex.isPending} onClick={handleCreateIndex}>
            Create index
          </Button>
        </div>
        {createIndex.isSuccess ? <Badge tone="ai">Column added</Badge> : null}
      </Card>
    </div>
  );
}
