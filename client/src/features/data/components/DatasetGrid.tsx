import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAddRow, useRemoveRow, useUpdateColumn, useUpdateRow } from "../hooks/useDataset";
import type { DatasetFull, MeasurementType } from "../types/dataset";

const measurementOptions: MeasurementType[] = ["nominal", "ordinal", "metric"];

function ColumnHeader({ datasetId, column }: { datasetId: number; column: DatasetFull["columns"][number] }) {
  const updateColumn = useUpdateColumn(datasetId);
  const [name, setName] = useState(column.name);

  return (
    <th className="min-w-[160px] border-b border-r border-surface-border bg-surface-canvas px-3 py-2 text-left align-top">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name.trim() && name !== column.name) updateColumn.mutate({ columnId: column.id, patch: { name: name.trim() } });
        }}
        className="w-full truncate bg-transparent font-semibold text-ink outline-none"
      />
      <select
        value={column.measurementType}
        onChange={(e) => updateColumn.mutate({ columnId: column.id, patch: { measurementType: e.target.value as MeasurementType } })}
        className="mt-1 w-full rounded border border-surface-border bg-surface-card text-helper text-ink-muted"
      >
        {measurementOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </th>
  );
}

function Cell({
  value,
  valueType,
  onCommit,
}: {
  value: string | number | null;
  valueType: "string" | "number";
  onCommit: (value: string | number | null) => void;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const trimmed = draft.trim();
        const next: string | number | null = trimmed === "" ? null : valueType === "number" ? Number(trimmed) : trimmed;
        if (next !== value) onCommit(next);
      }}
      className="w-full min-w-[140px] bg-transparent px-3 py-2 text-secondary text-ink outline-none focus:bg-brand-50"
    />
  );
}

export function DatasetGrid({ dataset }: { dataset: DatasetFull }) {
  const updateRow = useUpdateRow(dataset.id);
  const addRow = useAddRow(dataset.id);
  const removeRow = useRemoveRow(dataset.id);

  return (
    <div className="overflow-auto rounded-lg border border-surface-border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="w-10 border-b border-r border-surface-border bg-surface-canvas px-2 py-2 text-helper text-ink-muted">#</th>
            {dataset.columns.map((col) => (
              <ColumnHeader key={col.id} datasetId={dataset.id} column={col} />
            ))}
            <th className="w-10 border-b border-surface-border bg-surface-canvas" />
          </tr>
        </thead>
        <tbody>
          {dataset.rows.map((row, i) => (
            <tr key={row.id} className="border-b border-surface-border last:border-b-0 hover:bg-surface-canvas/60">
              <td className="border-r border-surface-border px-2 py-2 text-center text-helper text-ink-muted">{i + 1}</td>
              {dataset.columns.map((col) => (
                <td key={col.id} className="border-r border-surface-border">
                  <Cell
                    value={row.data[String(col.id)] ?? null}
                    valueType={col.valueType}
                    onCommit={(value) => updateRow.mutate({ rowId: row.id, rowData: { ...row.data, [String(col.id)]: value } })}
                  />
                </td>
              ))}
              <td className="text-center">
                <button
                  onClick={() => removeRow.mutate(row.id)}
                  aria-label="Delete row"
                  className="p-2 text-ink-muted hover:text-error-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => addRow.mutate(Object.fromEntries(dataset.columns.map((c) => [String(c.id), null])))}
        disabled={dataset.columns.length === 0}
        className="flex w-full items-center gap-1.5 border-t border-surface-border px-3 py-2 text-secondary font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> Add row
      </button>
    </div>
  );
}
