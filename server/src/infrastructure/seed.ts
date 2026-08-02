/**
 * Optional demo data - NOT run automatically on server start (the real app
 * starts empty, with proper empty states guiding the first action). Run
 * manually via `npm run db:seed` if you want a populated project to explore
 * the Analysis suite immediately.
 */
import { runMigrations } from "./db/migrate.js";
import { db } from "./db/client.js";
import { datasetColumns, datasetRows, datasets, projects } from "./db/schema.js";

async function seed() {
  runMigrations();

  const [project] = await db
    .insert(projects)
    .values({ name: "SME & Mobile Banking", topic: "Impact of mobile banking on SME growth", projectType: "business" })
    .returning();

  const [dataset] = await db.insert(datasets).values({ projectId: project.id, name: "SME banking survey" }).returning();

  const sectorCol = await db.insert(datasetColumns).values({ datasetId: dataset.id, name: "Sector", order: 0, measurementType: "nominal", valueType: "string" }).returning();
  const transactionsCol = await db.insert(datasetColumns).values({ datasetId: dataset.id, name: "Monthly transactions", order: 1, measurementType: "metric", valueType: "number" }).returning();
  const revenueCol = await db.insert(datasetColumns).values({ datasetId: dataset.id, name: "Revenue growth %", order: 2, measurementType: "metric", valueType: "number" }).returning();

  const sectors = ["Retail", "Services", "Manufacturing"];
  const rows = Array.from({ length: 60 }, (_, i) => {
    const sector = sectors[i % 3];
    const base = sector === "Manufacturing" ? 180 : sector === "Services" ? 140 : 100;
    const transactions = Math.round(base + (Math.random() - 0.5) * 40);
    const revenue = Number((transactions * 0.08 + (Math.random() - 0.5) * 5).toFixed(2));
    return {
      datasetId: dataset.id,
      rowIndex: i,
      data: {
        [String(sectorCol[0].id)]: sector,
        [String(transactionsCol[0].id)]: transactions,
        [String(revenueCol[0].id)]: revenue,
      },
    };
  });
  await db.insert(datasetRows).values(rows);

  console.log(`Seeded project "${project.name}" (id ${project.id}) with dataset "${dataset.name}" (${rows.length} rows).`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
