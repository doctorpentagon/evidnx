import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useQuality } from "../hooks/useDataset";

export function DataQualityPanel({ datasetId }: { datasetId: number }) {
  const { data: quality, isLoading } = useQuality(datasetId);

  if (isLoading || !quality) return <p className="text-secondary text-ink-muted">Loading quality report…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-heading-sm text-ink">{quality.totalRows}</p>
          <p className="text-helper text-ink-muted">Rows</p>
        </Card>
        <Card className="p-4">
          <p className="text-heading-sm text-ink">{quality.duplicateRows}</p>
          <p className="text-helper text-ink-muted">Duplicate rows</p>
        </Card>
        <Card className="p-4">
          <p className="text-heading-sm text-ink">{quality.completenessPercent.toFixed(1)}%</p>
          <p className="text-helper text-ink-muted">Completeness</p>
        </Card>
      </div>
      <Card className="p-4">
        <p className="mb-3 font-semibold text-ink">Missing values by column</p>
        <div className="flex flex-col gap-2">
          {quality.columns.map((col) => (
            <div key={col.columnId} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-secondary text-ink">{col.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-canvas">
                <div
                  className={`h-full rounded-full ${col.missingPercent > 20 ? "bg-warning-500" : "bg-ai-500"}`}
                  style={{ width: `${100 - col.missingPercent}%` }}
                />
              </div>
              <Badge tone={col.missingPercent > 20 ? "warning" : "neutral"}>{col.missingPercent.toFixed(0)}% missing</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
