import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

/**
 * Una única instancia de Prisma por proceso.
 * En desarrollo se reutiliza entre recargas para no agotar conexiones.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
