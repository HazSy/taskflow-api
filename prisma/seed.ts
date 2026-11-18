import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

/**
 * Datos de ejemplo para poder probar la API sin crear nada a mano.
 * Usuario: demo@taskflow.dev / demo1234
 */
async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Oscar López",
      email: "demo@taskflow.dev",
      password: await hashPassword("demo1234"),
      role: "ADMIN",
    },
  });

  const web = await prisma.project.create({
    data: {
      name: "Rediseño web corporativa",
      description: "Migración del site antiguo a un stack moderno con React y API propia.",
      color: "#6366f1",
      ownerId: user.id,
    },
  });

  const app = await prisma.project.create({
    data: {
      name: "App de inventario",
      description: "Control de stock con lector de códigos de barras para una tienda.",
      color: "#10b981",
      ownerId: user.id,
    },
  });

  const today = new Date();
  const inDays = (n: number) => new Date(today.getTime() + n * 86_400_000);

  await prisma.task.createMany({
    data: [
      { title: "Definir arquitectura de la API", status: "DONE", priority: "HIGH", projectId: web.id },
      { title: "Maquetar landing responsive", status: "IN_PROGRESS", priority: "HIGH", projectId: web.id, dueDate: inDays(3) },
      { title: "Configurar despliegue en producción", status: "TODO", priority: "MEDIUM", projectId: web.id, dueDate: inDays(10) },
      { title: "Diseñar esquema de base de datos", status: "DONE", priority: "HIGH", projectId: app.id },
      { title: "Pantalla de alta de producto", status: "IN_PROGRESS", priority: "MEDIUM", projectId: app.id, dueDate: inDays(5) },
      { title: "Exportar informe mensual a CSV", status: "TODO", priority: "LOW", projectId: app.id },
      { title: "Tests de integración del alta de stock", status: "TODO", priority: "HIGH", projectId: app.id, dueDate: inDays(1) },
    ],
  });

  console.log(`✅ Seed completado. Usuario demo: ${user.email} / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
