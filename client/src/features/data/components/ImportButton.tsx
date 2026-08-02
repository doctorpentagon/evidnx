import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useImportFile } from "../hooks/useDataset";

export function ImportButton({ datasetId }: { datasetId: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importFile = useImportFile(datasetId);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFile.mutate(file);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={importFile.isPending}>
        <Upload className="h-4 w-4" /> {importFile.isPending ? "Importing…" : "Import CSV/Excel"}
      </Button>
    </>
  );
}
