import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

async function auth(email: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "secreto123" })
    .expect(201);
  return { token: res.body.token as string, id: res.body.user.id as string };
}

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

describe("proyectos", () => {
  it("crea y lista solo los proyectos del usuario autenticado", async () => {
    const ana = await auth("ana@test.dev");
    const luis = await auth("luis@test.dev");

    await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ name: "Web corporativa" })
      .expect(201);

    const anaList = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .expect(200);
    const luisList = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${luis.token}`)
      .expect(200);

    expect(anaList.body.data).toHaveLength(1);
    expect(luisList.body.data).toHaveLength(0);
  });

  it("devuelve 404 al pedir un proyecto de otro usuario (sin filtrar datos)", async () => {
    const ana = await auth("ana@test.dev");
    const luis = await auth("luis@test.dev");

    const created = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ name: "Privado" })
      .expect(201);

    await request(app)
      .get(`/api/projects/${created.body.data.id}`)
      .set("Authorization", `Bearer ${luis.token}`)
      .expect(403);
  });

  it("rechaza colores que no son hexadecimales", async () => {
    const ana = await auth("ana@test.dev");
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ name: "Proyecto", color: "rojo" })
      .expect(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("tareas", () => {
  it("crea una tarea y actualiza su estado", async () => {
    const ana = await auth("ana@test.dev");
    const project = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ name: "App" });

    const task = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ title: "Diseñar pantalla", projectId: project.body.data.id })
      .expect(201);

    expect(task.body.data.status).toBe("TODO");

    const updated = await request(app)
      .patch(`/api/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ status: "DONE" })
      .expect(200);

    expect(updated.body.data.status).toBe("DONE");
  });

  it("no permite crear tareas en proyectos ajenos", async () => {
    const ana = await auth("ana@test.dev");
    const luis = await auth("luis@test.dev");

    const project = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ name: "App" });

    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${luis.token}`)
      .send({ title: "Intruso", projectId: project.body.data.id })
      .expect(403);
  });

  it("calcula el resumen de progreso", async () => {
    const ana = await auth("ana@test.dev");
    const project = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ name: "App" });

    const projectId = project.body.data.id;
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ title: "Primera", projectId, status: "DONE" });
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${ana.token}`)
      .send({ title: "Segunda", projectId, status: "TODO" });

    const res = await request(app)
      .get("/api/projects/summary")
      .set("Authorization", `Bearer ${ana.token}`)
      .expect(200);

    expect(res.body.data.tasks.total).toBe(2);
    expect(res.body.data.tasks.completionRate).toBe(50);
  });
});
