import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { AppError } from "../../../shared/errors.js";
import { analysisService } from "../../analyses/services/analysis.service.js";
import { referenceService } from "../../literature/services/reference.service.js";
import type { CreateReportInput, ReportSectionInput, UpdateReportInput } from "../dto/report.dto.js";
import { reportRepository } from "../repositories/report.repository.js";

interface ResolvedBlock {
  kind: "heading" | "paragraph" | "table" | "citation";
  level?: 1 | 2 | 3;
  text?: string;
  table?: { headers: string[]; rows: (string | number)[][] };
}

/** Turns an analysis's stored `results` object into a flat key/value table -
 * generic across all 19 analysis types since result shapes vary widely. */
function resultsToTable(results: Record<string, unknown>): { headers: string[]; rows: (string | number)[][] } {
  const rows: (string | number)[][] = [];
  for (const [key, value] of Object.entries(results)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "number") rows.push([key, Number(value.toFixed(4))]);
    else if (typeof value === "string") rows.push([key, value]);
    else if (typeof value === "boolean") rows.push([key, String(value)]);
  }
  return { headers: ["Metric", "Value"], rows };
}

async function resolveSections(sections: ReportSectionInput[]): Promise<ResolvedBlock[]> {
  const blocks: ResolvedBlock[] = [];
  for (const section of sections) {
    if (section.type === "heading") {
      blocks.push({ kind: "heading", level: section.level, text: section.text });
    } else if (section.type === "paragraph") {
      blocks.push({ kind: "paragraph", text: section.text });
    } else if (section.type === "citation") {
      const ref = await referenceService.getById(section.referenceId);
      blocks.push({ kind: "citation", text: ref.citations.apa });
    } else {
      const analysis = await analysisService.getById(section.analysisId);
      blocks.push({ kind: "heading", level: 2, text: analysis.title });
      if (section.include.includes("interpretation") && analysis.interpretation) {
        const interp = analysis.interpretation as { narrative?: { academic?: string } };
        if (interp.narrative?.academic) {
          blocks.push({ kind: "paragraph", text: interp.narrative.academic });
        }
      }
      if (section.include.includes("table") && analysis.results) {
        blocks.push({ kind: "table", table: resultsToTable(analysis.results as Record<string, unknown>) });
      }
      // Note: chart images are intentionally not rendered into the exported
      // PDF/DOCX in this version - they remain viewable on the Analysis
      // screens in-app. Adding this would mean a server-side chart renderer
      // (e.g. headless canvas), which is a deliberate scope cut for now.
    }
  }
  return blocks;
}

export const reportService = {
  async listByProject(projectId: number) {
    return reportRepository.findAllByProject(projectId);
  },

  async getById(id: number) {
    const report = await reportRepository.findById(id);
    if (!report) throw AppError.notFound("Report", id);
    return report;
  },

  async create(input: CreateReportInput) {
    return reportRepository.create(input.projectId, input.title, input.sections);
  },

  async update(id: number, input: UpdateReportInput) {
    const existing = await reportRepository.findById(id);
    if (!existing) throw AppError.notFound("Report", id);
    return reportRepository.update(id, input);
  },

  async remove(id: number) {
    const existing = await reportRepository.findById(id);
    if (!existing) throw AppError.notFound("Report", id);
    await reportRepository.remove(id);
  },

  async exportPdf(id: number): Promise<Buffer> {
    const report = await this.getById(id);
    const blocks = await resolveSections(report.sections);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 56 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.font("Helvetica-Bold").fontSize(20).text(report.title, { align: "left" });
      doc.moveDown();

      for (const block of blocks) {
        if (block.kind === "heading") {
          doc.moveDown(0.5);
          doc.font("Helvetica-Bold").fontSize(block.level === 1 ? 16 : block.level === 2 ? 14 : 12);
          doc.text(block.text ?? "");
          doc.moveDown(0.3);
        } else if (block.kind === "paragraph") {
          doc.font("Helvetica").fontSize(11).text(block.text ?? "", { align: "left", lineGap: 3 });
          doc.moveDown(0.5);
        } else if (block.kind === "citation") {
          doc.font("Helvetica-Oblique").fontSize(10).text(block.text ?? "", { indent: 20 });
          doc.moveDown(0.3);
        } else if (block.kind === "table" && block.table) {
          doc.font("Helvetica-Bold").fontSize(10);
          const colWidth = 240;
          for (const row of block.table.rows) {
            const y = doc.y;
            doc.font("Helvetica").fontSize(10).text(String(row[0]), 56, y, { width: colWidth });
            doc.text(String(row[1]), 56 + colWidth, y, { width: colWidth });
          }
          doc.moveDown(0.5);
        }
      }

      doc.end();
    });
  },

  async exportDocx(id: number): Promise<Buffer> {
    const report = await this.getById(id);
    const blocks = await resolveSections(report.sections);

    const children: (Paragraph | Table)[] = [
      new Paragraph({ text: report.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT }),
    ];

    for (const block of blocks) {
      if (block.kind === "heading") {
        const headingLevel = block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
        children.push(new Paragraph({ text: block.text ?? "", heading: headingLevel }));
      } else if (block.kind === "paragraph") {
        children.push(new Paragraph({ children: [new TextRun(block.text ?? "")] }));
      } else if (block.kind === "citation") {
        children.push(new Paragraph({ children: [new TextRun({ text: block.text ?? "", italics: true })], indent: { left: 400 } }));
      } else if (block.kind === "table" && block.table) {
        children.push(
          new Table({
            rows: block.table.rows.map(
              (row) =>
                new TableRow({
                  children: row.map((cell) => new TableCell({ children: [new Paragraph(String(cell))] })),
                }),
            ),
          }),
        );
        children.push(new Paragraph({ text: "" }));
      }
    }

    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  },
};
