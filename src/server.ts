import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 TaskFlow API escuchando en http://localhost:${env.PORT}/api/health`);
});

/** Cierre ordenado: deja de aceptar peticiones y cierra la conexión a la BD. */
async function shutdown(signal: string) {
  console.log(`\n${signal} recibido, cerrando…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
