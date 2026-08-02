export type MeasurementType = "nominal" | "ordinal" | "metric";
export type ValueType = "string" | "number";
export type CellValue = string | number | null;

export interface DatasetSummary {
  id: number;
  projectId: number;
  name: string;
  source: "manual" | "import" | "questionnaire";
  sourceQuestionnaireId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetColumn {
  id: number;
  datasetId: number;
  name: string;
  order: number;
  measurementType: MeasurementType;
  valueType: ValueType;
}

export interface DatasetRow {
  id: number;
  datasetId: number;
  rowIndex: number;
  data: Record<string, CellValue>;
}

export interface DatasetFull extends DatasetSummary {
  columns: DatasetColumn[];
  rows: DatasetRow[];
}

export interface QualityReport {
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  completenessPercent: number;
  columns: { columnId: number; name: string; missing: number; missingPercent: number }[];
}
