import { createApp } from "./app/app.js";
import { env } from "./config/env.js";
import { runMigrations } from "./infrastructure/db/migrate.js";

runMigrations();

const app = createApp();

app.listen(env.port, () => {
  console.log(`EvidNX server listening on http://localhost:${env.port}`);
});
