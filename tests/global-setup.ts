import { execSync } from "node:child_process";

/**
 * Prepara una base de datos SQLite limpia y aislada para los tests.
 * Se ejecuta una sola vez por pasada de Vitest.
 */
export default function setup() {
  execSync("npx prisma db push --skip-generate --force-reset", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
