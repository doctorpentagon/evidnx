import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDetectOutliers, useHandleMissing, useRemoveDuplicates, useStandardize } from "../hooks/useDataset";
import type { DatasetFull } from "../types/dataset";

const strategies = [
  { value: "remove_row", label: "Remove rows with missing values" },
  { value: "fill_mean", label: "Fill with mean" },
  { value: "fill_median", label: "Fill with median" },
  { value: "fill_mode", label: "Fill with mode" },
] as const;

export function CleaningPanel({ dataset }: { dataset: DatasetFull }) {
  const [missingColumnId, setMissingColumnId] = useState<number | null>(dataset.columns[0]?.id ?? null);
  const [strategy, setStrategy] = useState<(typeof strategies)[number]["value"]>("fill_mean");
  const [outlierColumnId, setOutlierColumnId] = useState<number | null>(
    dataset.columns.find((c) => c.measurementType === "metric")?.id ?? null,
  );
  const [outlierResult, setOutlierResult] = useState<{ count: number; stdDev: number } | null>(null);

  const handleMissing = useHandleMissing(dataset.id);
  const removeDuplicates = useRemoveDuplicates(dataset.id);
  const detectOutliers = useDetectOutliers(dataset.id);
  const standardize = useStandardize(dataset.id);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState<number | null>(null);

  const numericColumns = dataset.columns.filter((c) => c.valueType === "number");

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <p className="font-semibold text-ink">Handle missing values</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={missingColumnId ?? ""}
            onChange={(e) => setMissingColumnId(Number(e.target.value))}
            className="h-9 rounded-md border border-surface-border px-2 text-secondary"
          >
            {dataset.columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as typeof strategy)}
            className="h-9 rounded-md border border-surface-border px-2 text-secondary"
          >
            {strategies.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={missingColumnId === null || handleMissing.isPending}
            onClick={() => missingColumnId && handleMissing.mutate({ columnId: missingColumnId, strategy })}
          >
            Apply
          </Button>
        </div>
        {handleMissing.isSuccess ? <Badge tone="ai">Applied</Badge> : null}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <p className="font-semibold text-ink">Duplicates</p>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={removeDuplicates.isPending}
            onClick={async () => {
              const result = await removeDuplicates.mutateAsync();
              setDuplicatesRemoved(result.removed);
            }}
          >
            Remove duplicate rows
          </Button>
          {duplicatesRemoved !== null ? <Badge tone="ai">{duplicatesRemoved} removed</Badge> : null}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <p className="font-semibold text-ink">Outliers &amp; standardization</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={outlierColumnId ?? ""}
            onChange={(e) => setOutlierColumnId(Number(e.target.value))}
            className="h-9 rounded-md border border-surface-border px-2 text-secondary"
          >
            {numericColumns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={outlierColumnId === null || detectOutliers.isPending}
            onClick={async () => {
              if (!outlierColumnId) return;
              const result = await detectOutliers.mutateAsync(outlierColumnId);
              setOutlierResult(result);
            }}
          >
            Detect outliers (|z| &gt; 3)
          </Button>
          <Button
            size="sm"
            disabled={outlierColumnId === null || standardize.isPending}
            onClick={() => outlierColumnId && standardize.mutate(outlierColumnId)}
          >
            Add z-score column
          </Button>
        </div>
        {outlierResult ? (
          <p className="text-secondary text-ink-muted">
            {outlierResult.count} outlier{outlierResult.count === 1 ? "" : "s"} found (std dev {outlierResult.stdDev.toFixed(2)})
          </p>
        ) : null}
        {standardize.isSuccess ? <Badge tone="ai">Standardized column added</Badge> : null}
      </Card>
    </div>
  );
}
