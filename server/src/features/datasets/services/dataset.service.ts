import ExcelJS from "exceljs";
import Papa from "papaparse";
import { AppError } from "../../../shared/errors.js";
import { mean, median, mode, stdDev, zScores } from "../../../shared/stats/descriptive.js";
import type {
  CreateIndexInput,
  HandleMissingInput,
  RecodeInput,
} from "../dto/dataset.dto.js";
import { datasetRepository } from "../repositories/dataset.repository.js";

export interface InferredColumnType {
  measurementType: "nominal" | "ordinal" | "metric";
  valueType: "string" | "number";
  confidence: "low" | "medium" | "high";
  evidence: string[];
  requiresConfirmation: boolean;
}

export function inferColumnType(values: (string | number | null)[]): InferredColumnType {
  const nonNull = values.filter((v) => v !== null && v !== "");
  if (nonNull.length === 0) {
    return {
      measurementType: "nominal",
      valueType: "string",
      confidence: "low",
      evidence: ["The column has no non-empty values."],
      requiresConfirmation: true,
    };
  }
  const numericCount = nonNull.filter((v) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))).length;
  const isNumeric = numericCount / nonNull.length > 0.9;
  if (!isNumeric) {
    return {
      measurementType: "nominal",
      valueType: "string",
      confidence: numericCount === 0 ? "high" : "medium",
      evidence: [`${Math.round((numericCount / nonNull.length) * 100)}% of non-empty values are numeric.`],
      requiresConfirmation: numericCount > 0,
    };
  }

  const numbers = nonNull.map(Number);
  const distinct = [...new Set(numbers)];
  const allIntegers = numbers.every(Number.isInteger);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  if (distinct.length <= 2) {
    return {
      measurementType: "nominal",
      valueType: "number",
      confidence: "medium",
      evidence: [`Only ${distinct.length} distinct numeric categories were detected.`],
      requiresConfirmation: true,
    };
  }

  if (allIntegers && distinct.length <= 10 && max - min <= 10) {
    return {
      measurementType: "ordinal",
      valueType: "number",
      confidence: "medium",
      evidence: [`Detected ${distinct.length} ordered integer levels from ${min} to ${max}; this may be a rating/Likert scale.`],
      requiresConfirmation: true,
    };
  }

  return {
    measurementType: "metric",
    valueType: "number",
    confidence: "medium",
    evidence: ["More than 90% of values are numeric with enough distinct values for a continuous measure."],
    requiresConfirmation: true,
  };
}

function normalizeSpreadsheetValue(value: ExcelJS.CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  if ("result" in value) return normalizeSpreadsheetValue(value.result ?? null);
  if ("richText" in value) return value.richText.map((part) => part.text).join("");
  if ("text" in value) return value.text;
  return String(value);
}

async function parseSpreadsheet(buffer: Buffer, originalName: string): Promise<(string | number | null)[][]> {
  const extension = originalName.toLowerCase().split(".").pop();
  if (extension === "csv") {
    const parsed = Papa.parse<(string | number | null)[]>(buffer.toString("utf8"), {
      skipEmptyLines: false,
      dynamicTyping: true,
    });
    if (parsed.errors.length > 0) {
      throw AppError.badRequest(`CSV parsing failed: ${parsed.errors[0].message}`);
    }
    return parsed.data;
  }

  if (extension !== "xlsx") {
    throw AppError.badRequest("Only CSV and modern .xlsx workbooks are supported. Save legacy .xls files as .xlsx first.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: (string | number | null)[][] = [];
  const width = sheet.columnCount;
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values: (string | number | null)[] = [];
    for (let column = 1; column <= width; column += 1) {
      values.push(normalizeSpreadsheetValue(row.getCell(column).value));
    }
    rows.push(values);
  });
  return rows;
}

export const datasetService = {
  async listByProject(projectId: number) {
    return datasetRepository.findAllByProject(projectId);
  },

  async getFull(id: number) {
    const dataset = await datasetRepository.findById(id);
    if (!dataset) throw AppError.notFound("Dataset", id);
    const columns = await datasetRepository.getColumns(id);
    const rows = await datasetRepository.getRows(id);
    return { ...dataset, columns, rows };
  },

  async create(projectId: number, name: string, columns: { name: string; measurementType: "nominal" | "ordinal" | "metric"; valueType: "string" | "number" }[]) {
    const dataset = await datasetRepository.create(projectId, name);
    for (const col of columns) {
      await datasetRepository.addColumn(dataset.id, col.name, col.measurementType, col.valueType);
    }
    return this.getFull(dataset.id);
  },

  async rename(id: number, name: string) {
    const existing = await datasetRepository.findById(id);
    if (!existing) throw AppError.notFound("Dataset", id);
    return datasetRepository.rename(id, name);
  },

  async addColumn(datasetId: number, name: string, measurementType: "nominal" | "ordinal" | "metric", valueType: "string" | "number") {
    const dataset = await datasetRepository.findById(datasetId);
    if (!dataset) throw AppError.notFound("Dataset", datasetId);
    return datasetRepository.addColumn(datasetId, name, measurementType, valueType);
  },

  async removeColumn(columnId: number) {
    const existing = await datasetRepository.getColumn(columnId);
    if (!existing) throw AppError.notFound("Column", columnId);
    await datasetRepository.removeColumn(columnId);
  },

  async updateColumn(
    columnId: number,
    patch: Partial<{ name: string; measurementType: "nominal" | "ordinal" | "metric"; valueType: "string" | "number"; order: number }>,
  ) {
    const existing = await datasetRepository.getColumn(columnId);
    if (!existing) throw AppError.notFound("Column", columnId);
    return datasetRepository.updateColumn(columnId, patch);
  },

  async addRow(datasetId: number, data: Record<string, string | number | null>) {
    const rows = await datasetRepository.getRows(datasetId);
    return datasetRepository.addRow(datasetId, rows.length, data);
  },

  async updateRow(rowId: number, data: Record<string, string | number | null>) {
    return datasetRepository.updateRow(rowId, data);
  },

  async removeRow(rowId: number) {
    await datasetRepository.removeRow(rowId);
  },

  async remove(id: number) {
    const existing = await datasetRepository.findById(id);
    if (!existing) throw AppError.notFound("Dataset", id);
    await datasetRepository.remove(id);
  },

  /** Parses an uploaded CSV/XLSX buffer, replacing the dataset's current
   * columns and rows with the imported content (auto-detecting measurement
   * type per column, same as DataTab/Numiqo's auto-suggested scale level). */
  async importFile(datasetId: number, buffer: Buffer, originalName: string) {
    const rows = await parseSpreadsheet(buffer, originalName);

    if (rows.length < 1) {
      throw AppError.badRequest(`"${originalName}" has no rows to import.`);
    }

    const headerRow = rows[0].map((h, i) => (h === null || String(h).trim() === "" ? `Column ${i + 1}` : String(h)));
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== ""));

    const existingColumns = await datasetRepository.getColumns(datasetId);
    for (const col of existingColumns) await datasetRepository.removeColumn(col.id);
    await datasetRepository.clearRows(datasetId);

    const columnIds: number[] = [];
    for (let c = 0; c < headerRow.length; c++) {
      const columnValues = dataRows.map((row) => row[c] ?? null);
      const inference = inferColumnType(columnValues);
      const created = await datasetRepository.addColumn(datasetId, headerRow[c], inference.measurementType, inference.valueType);
      columnIds.push(created.id);
    }

    const parsedRows = dataRows.map((row) => {
      const record: Record<string, string | number | null> = {};
      columnIds.forEach((colId, i) => {
        const raw = row[i];
        record[String(colId)] = raw === undefined ? null : raw;
      });
      return record;
    });
    await datasetRepository.bulkAddRows(datasetId, parsedRows);

    return this.getFull(datasetId);
  },

  async exportToBuffer(datasetId: number, format: "xlsx" | "csv") {
    const { columns, rows } = await this.getFull(datasetId);
    const header = columns.map((c) => c.name);
    const body = rows.map((r) => columns.map((c) => r.data[String(c.id)] ?? ""));
    if (format === "csv") {
      return Buffer.from(Papa.unparse([header, ...body]), "utf8");
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");
    sheet.addRows([header, ...body]);
    const output = await workbook.xlsx.writeBuffer();
    return Buffer.from(output);
  },

  /** Column values as typed numbers or strings, nulls dropped - the primary
   * accessor the analyses feature uses to pull a variable's data. */
  async getColumnValues(datasetId: number, columnId: number): Promise<(string | number)[]> {
    const rows = await datasetRepository.getRows(datasetId);
    const column = await datasetRepository.getColumn(columnId);
    if (!column) throw AppError.notFound("Column", columnId);
    return rows
      .map((r) => r.data[String(columnId)])
      .filter((v): v is string | number => v !== null && v !== undefined && v !== "");
  },

  async getNumericColumnValues(datasetId: number, columnId: number): Promise<number[]> {
    const values = await this.getColumnValues(datasetId, columnId);
    return values.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
  },

  async getQualityReport(datasetId: number) {
    const { columns, rows } = await this.getFull(datasetId);
    const total = rows.length;

    const perColumn = columns.map((col) => {
      const missing = rows.filter((r) => {
        const v = r.data[String(col.id)];
        return v === null || v === undefined || v === "";
      }).length;
      return { columnId: col.id, name: col.name, missing, missingPercent: total === 0 ? 0 : (missing / total) * 100 };
    });

    const seen = new Set<string>();
    let duplicates = 0;
    for (const row of rows) {
      const key = JSON.stringify(columns.map((c) => row.data[String(c.id)]));
      if (seen.has(key)) duplicates++;
      else seen.add(key);
    }

    const totalCells = total * columns.length;
    const missingCells = perColumn.reduce((s, c) => s + c.missing, 0);
    const completeness = totalCells === 0 ? 100 : ((totalCells - missingCells) / totalCells) * 100;

    return {
      totalRows: total,
      totalColumns: columns.length,
      duplicateRows: duplicates,
      completenessPercent: completeness,
      columns: perColumn,
    };
  },

  async handleMissing(datasetId: number, input: HandleMissingInput) {
    const rows = await datasetRepository.getRows(datasetId);
    const column = await datasetRepository.getColumn(input.columnId);
    if (!column) throw AppError.notFound("Column", input.columnId);
    const key = String(input.columnId);

    if (input.strategy === "remove_row") {
      for (const row of rows) {
        const v = row.data[key];
        if (v === null || v === undefined || v === "") await datasetRepository.removeRow(row.id);
      }
      return;
    }

    const numericValues = rows.map((r) => Number(r.data[key])).filter((v) => !Number.isNaN(v));
    const stringValues = rows.map((r) => r.data[key]).filter((v): v is string => typeof v === "string" && v !== "");

    let fillValue: string | number;
    if (input.strategy === "fill_mean") fillValue = mean(numericValues);
    else if (input.strategy === "fill_median") fillValue = median(numericValues);
    else if (input.strategy === "fill_mode") fillValue = mode(column.valueType === "number" ? numericValues : stringValues)[0];
    else fillValue = input.fillValue ?? "";

    for (const row of rows) {
      const v = row.data[key];
      if (v === null || v === undefined || v === "") {
        await datasetRepository.updateRow(row.id, { ...row.data, [key]: fillValue });
      }
    }
  },

  async removeDuplicates(datasetId: number) {
    const { columns, rows } = await this.getFull(datasetId);
    const seen = new Set<string>();
    let removed = 0;
    for (const row of rows) {
      const key = JSON.stringify(columns.map((c) => row.data[String(c.id)]));
      if (seen.has(key)) {
        await datasetRepository.removeRow(row.id);
        removed++;
      } else {
        seen.add(key);
      }
    }
    return { removed };
  },

  /** Flags rows whose z-score for the given column exceeds +/-3 (a standard
   * outlier threshold), and optionally creates a standardized (z-score) copy
   * of the column - matches the "Prepare data" screen's "Apply z-score
   * standardization" action. */
  async detectOutliers(datasetId: number, columnId: number, threshold = 3) {
    const rows = await datasetRepository.getRows(datasetId);
    const key = String(columnId);
    const values = rows.map((r) => Number(r.data[key])).filter((v) => !Number.isNaN(v));
    const z = zScores(values);
    const outlierRowIds: number[] = [];
    let zi = 0;
    for (const row of rows) {
      const v = Number(row.data[key]);
      if (Number.isNaN(v)) continue;
      if (Math.abs(z[zi]) > threshold) outlierRowIds.push(row.id);
      zi++;
    }
    return { outlierRowIds, count: outlierRowIds.length, stdDev: stdDev(values) };
  },

  async standardizeColumn(datasetId: number, columnId: number) {
    const column = await datasetRepository.getColumn(columnId);
    if (!column) throw AppError.notFound("Column", columnId);
    const rows = await datasetRepository.getRows(datasetId);
    const key = String(columnId);
    const values = rows.map((r) => Number(r.data[key])).filter((v) => !Number.isNaN(v));
    const z = zScores(values);

    const newColumn = await datasetRepository.addColumn(datasetId, `${column.name} (z-score)`, "metric", "number");
    let zi = 0;
    for (const row of rows) {
      const v = Number(row.data[key]);
      const value = Number.isNaN(v) ? null : Number(z[zi++].toFixed(4));
      await datasetRepository.updateRow(row.id, { ...row.data, [String(newColumn.id)]: value });
    }
    return newColumn;
  },

  async recode(datasetId: number, input: RecodeInput) {
    const sourceColumn = await datasetRepository.getColumn(input.sourceColumnId);
    if (!sourceColumn) throw AppError.notFound("Column", input.sourceColumnId);
    const rows = await datasetRepository.getRows(datasetId);
    const sourceKey = String(input.sourceColumnId);

    const newColumn = await datasetRepository.addColumn(datasetId, input.newColumnName, "nominal", "string");
    for (const row of rows) {
      const raw = row.data[sourceKey];
      let newValue: string | number | null = null;
      if (raw !== null && raw !== undefined) {
        for (const mapping of input.mappings) {
          if (mapping.kind === "value" && String(raw) === String(mapping.from)) {
            newValue = mapping.to;
            break;
          }
          if (mapping.kind === "range") {
            const num = Number(raw);
            if (!Number.isNaN(num) && num >= mapping.fromValue && num <= mapping.toValue) {
              newValue = mapping.newValue;
              break;
            }
          }
        }
      }
      await datasetRepository.updateRow(row.id, { ...row.data, [String(newColumn.id)]: newValue });
    }
    return newColumn;
  },

  async createIndex(datasetId: number, input: CreateIndexInput) {
    const rows = await datasetRepository.getRows(datasetId);
    const keys = input.sourceColumnIds.map(String);
    const minValid = input.minValidValues ?? input.sourceColumnIds.length;

    const newColumn = await datasetRepository.addColumn(datasetId, input.newColumnName, "metric", "number");
    for (const row of rows) {
      const values = keys.map((k) => row.data[k]).filter((v) => v !== null && v !== undefined && v !== "").map(Number).filter((v) => !Number.isNaN(v));
      let indexValue: number | null = null;
      if (values.length >= minValid) {
        indexValue = input.method === "sum" ? values.reduce((s, v) => s + v, 0) : mean(values);
      }
      await datasetRepository.updateRow(row.id, { ...row.data, [String(newColumn.id)]: indexValue });
    }
    return newColumn;
  },
};
