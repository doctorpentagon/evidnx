import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type { CellValue, DatasetColumn, DatasetFull, DatasetSummary, MeasurementType, QualityReport, ValueType } from "../types/dataset";

export const datasetService = {
  async listByProject(projectId: number): Promise<DatasetSummary[]> {
    const { data } = await api.get<ApiEnvelope<DatasetSummary[]>>(`/projects/${projectId}/datasets`);
    return data.data;
  },

  async create(projectId: number, name: string): Promise<DatasetFull> {
    const { data } = await api.post<ApiEnvelope<DatasetFull>>(`/projects/${projectId}/datasets`, { projectId, name, columns: [] });
    return data.data;
  },

  async getById(id: number): Promise<DatasetFull> {
    const { data } = await api.get<ApiEnvelope<DatasetFull>>(`/datasets/${id}`);
    return data.data;
  },

  async importFile(id: number, file: File): Promise<DatasetFull> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<ApiEnvelope<DatasetFull>>(`/datasets/${id}/import`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  exportUrl(id: number, format: "csv" | "xlsx") {
    return `/api/datasets/${id}/export?format=${format}`;
  },

  async addColumn(datasetId: number, input: { name: string; measurementType: MeasurementType; valueType: ValueType }): Promise<DatasetColumn> {
    const { data } = await api.post<ApiEnvelope<DatasetColumn>>(`/datasets/${datasetId}/columns`, input);
    return data.data;
  },

  async removeColumn(columnId: number): Promise<void> {
    await api.delete(`/datasets/columns/${columnId}`);
  },

  async updateColumn(columnId: number, patch: Partial<{ name: string; measurementType: MeasurementType; valueType: ValueType }>): Promise<DatasetColumn> {
    const { data } = await api.patch<ApiEnvelope<DatasetColumn>>(`/datasets/columns/${columnId}`, patch);
    return data.data;
  },

  async addRow(datasetId: number, rowData: Record<string, CellValue>) {
    const { data } = await api.post(`/datasets/${datasetId}/rows`, { data: rowData });
    return data.data;
  },

  async updateRow(rowId: number, rowData: Record<string, CellValue>) {
    const { data } = await api.patch(`/datasets/rows/${rowId}`, { data: rowData });
    return data.data;
  },

  async removeRow(rowId: number) {
    await api.delete(`/datasets/rows/${rowId}`);
  },

  async getQuality(id: number): Promise<QualityReport> {
    const { data } = await api.get<ApiEnvelope<QualityReport>>(`/datasets/${id}/quality`);
    return data.data;
  },

  async handleMissing(id: number, input: { columnId: number; strategy: "remove_row" | "fill_mean" | "fill_median" | "fill_mode" | "fill_value"; fillValue?: string | number }) {
    const { data } = await api.post<ApiEnvelope<DatasetFull>>(`/datasets/${id}/clean/handle-missing`, input);
    return data.data;
  },

  async removeDuplicates(id: number): Promise<{ removed: number }> {
    const { data } = await api.post(`/datasets/${id}/clean/remove-duplicates`);
    return data.data;
  },

  async detectOutliers(id: number, columnId: number): Promise<{ outlierRowIds: number[]; count: number; stdDev: number }> {
    const { data } = await api.post(`/datasets/${id}/clean/detect-outliers`, { columnId });
    return data.data;
  },

  async standardize(id: number, columnId: number): Promise<DatasetColumn> {
    const { data } = await api.post<ApiEnvelope<DatasetColumn>>(`/datasets/${id}/clean/standardize`, { columnId });
    return data.data;
  },

  async recode(id: number, input: { sourceColumnId: number; newColumnName: string; mappings: unknown[] }): Promise<DatasetColumn> {
    const { data } = await api.post<ApiEnvelope<DatasetColumn>>(`/datasets/${id}/transform/recode`, input);
    return data.data;
  },

  async createIndex(id: number, input: { sourceColumnIds: number[]; newColumnName: string; method: "sum" | "mean"; minValidValues?: number }): Promise<DatasetColumn> {
    const { data } = await api.post<ApiEnvelope<DatasetColumn>>(`/datasets/${id}/transform/create-index`, input);
    return data.data;
  },
};
