import { useState } from "react";
import { Database, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ComingSoon";
import { useCurrentProject } from "@/providers/CurrentProjectContext";
import { useDatasets } from "../hooks/useDatasets";
import { useDataset } from "../hooks/useDataset";
import { datasetService } from "../services/dataset.service";
import { DatasetGrid } from "../components/DatasetGrid";
import { DataQualityPanel } from "../components/DataQualityPanel";
import { CleaningPanel } from "../components/CleaningPanel";
import { TransformPanel } from "../components/TransformPanel";
import { ImportButton } from "../components/ImportButton";
import { NewDatasetModal } from "../components/NewDatasetModal";

type Tab = "grid" | "quality" | "clean" | "transform";
const tabs: { key: Tab; label: string }[] = [
  { key: "grid", label: "Grid" },
  { key: "quality", label: "Data quality" },
  { key: "clean", label: "Prepare data" },
  { key: "transform", label: "Transform" },
];

export function DataPage() {
  const { currentProjectId } = useCurrentProject();
  const { data: datasets, isLoading: loadingList } = useDatasets(currentProjectId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<Tab>("grid");

  const activeId = selectedId ?? datasets?.[0]?.id ?? null;
  const { data: dataset, isLoading: loadingDataset } = useDataset(activeId ?? -1);

  if (currentProjectId === null) {
    return (
      <ComingSoon
        icon={Database}
        title="No project selected"
        description="Open a project from the Dashboard first — datasets belong to a project."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg text-ink">Data</h1>
          <p className="mt-1 text-body text-ink-muted">Type, paste, or import — then clean and transform.</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New dataset
        </Button>
      </div>

      {loadingList ? (
        <p className="text-secondary text-ink-muted">Loading datasets…</p>
      ) : datasets && datasets.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="h-9 rounded-md border border-surface-border px-2 text-secondary"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {activeId ? <ImportButton datasetId={activeId} /> : null}
            {activeId ? (
              <>
                <a href={datasetService.exportUrl(activeId, "csv")} className="inline-block">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" /> CSV
                  </Button>
                </a>
                <a href={datasetService.exportUrl(activeId, "xlsx")} className="inline-block">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" /> Excel
                  </Button>
                </a>
              </>
            ) : null}
          </div>

          <div className="flex gap-1 border-b border-surface-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-secondary font-medium ${
                  tab === t.key ? "border-b-2 border-brand-500 text-brand-600" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loadingDataset || !dataset ? (
            <p className="text-secondary text-ink-muted">Loading dataset…</p>
          ) : tab === "grid" ? (
            <DatasetGrid dataset={dataset} />
          ) : tab === "quality" ? (
            <DataQualityPanel datasetId={dataset.id} />
          ) : tab === "clean" ? (
            <CleaningPanel dataset={dataset} />
          ) : (
            <TransformPanel dataset={dataset} />
          )}
        </>
      ) : (
        <ComingSoon
          icon={Database}
          title="No datasets yet"
          description="Create a dataset manually, or collect responses through a questionnaire — either way, real data lands here."
        />
      )}

      {showNew ? (
        <NewDatasetModal
          projectId={currentProjectId}
          onClose={() => setShowNew(false)}
          onCreated={(id) => setSelectedId(id)}
        />
      ) : null}
    </div>
  );
}
