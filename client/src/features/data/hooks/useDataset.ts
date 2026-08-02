import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { datasetService } from "../services/dataset.service";
import type { CellValue, MeasurementType, ValueType } from "../types/dataset";

function useInvalidateDataset(id: number) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["datasets", id] });
}

export function useDataset(id: number) {
  return useQuery({
    queryKey: ["datasets", id],
    queryFn: () => datasetService.getById(id),
    enabled: Number.isFinite(id),
  });
}

export function useImportFile(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (file: File) => datasetService.importFile(id, file),
    onSuccess: invalidate,
  });
}

export function useAddColumn(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (input: { name: string; measurementType: MeasurementType; valueType: ValueType }) => datasetService.addColumn(id, input),
    onSuccess: invalidate,
  });
}

export function useRemoveColumn(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (columnId: number) => datasetService.removeColumn(columnId),
    onSuccess: invalidate,
  });
}

export function useUpdateColumn(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: ({ columnId, patch }: { columnId: number; patch: Partial<{ name: string; measurementType: MeasurementType; valueType: ValueType }> }) =>
      datasetService.updateColumn(columnId, patch),
    onSuccess: invalidate,
  });
}

export function useAddRow(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (rowData: Record<string, CellValue>) => datasetService.addRow(id, rowData),
    onSuccess: invalidate,
  });
}

export function useUpdateRow(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: ({ rowId, rowData }: { rowId: number; rowData: Record<string, CellValue> }) => datasetService.updateRow(rowId, rowData),
    onSuccess: invalidate,
  });
}

export function useRemoveRow(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (rowId: number) => datasetService.removeRow(rowId),
    onSuccess: invalidate,
  });
}

export function useQuality(id: number) {
  return useQuery({
    queryKey: ["datasets", id, "quality"],
    queryFn: () => datasetService.getQuality(id),
    enabled: Number.isFinite(id),
  });
}

export function useHandleMissing(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { columnId: number; strategy: "remove_row" | "fill_mean" | "fill_median" | "fill_mode" | "fill_value"; fillValue?: string | number }) =>
      datasetService.handleMissing(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets", id] });
      queryClient.invalidateQueries({ queryKey: ["datasets", id, "quality"] });
    },
  });
}

export function useRemoveDuplicates(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => datasetService.removeDuplicates(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets", id] });
      queryClient.invalidateQueries({ queryKey: ["datasets", id, "quality"] });
    },
  });
}

export function useDetectOutliers(id: number) {
  return useMutation({
    mutationFn: (columnId: number) => datasetService.detectOutliers(id, columnId),
  });
}

export function useStandardize(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (columnId: number) => datasetService.standardize(id, columnId),
    onSuccess: invalidate,
  });
}

export function useRecode(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (input: { sourceColumnId: number; newColumnName: string; mappings: unknown[] }) => datasetService.recode(id, input),
    onSuccess: invalidate,
  });
}

export function useCreateIndex(id: number) {
  const invalidate = useInvalidateDataset(id);
  return useMutation({
    mutationFn: (input: { sourceColumnIds: number[]; newColumnName: string; method: "sum" | "mean"; minValidValues?: number }) =>
      datasetService.createIndex(id, input),
    onSuccess: invalidate,
  });
}
