import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

async function registerAndLogin(email = "ana@test.dev") {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ana", email, password: "secreto123" })
    .expect(201);
  return res.body as { token: string; user: { id: string; email: string } };
}

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

describe("POST /api/auth/register", () => {
  it("crea el usuario y devuelve un token", async () => {
    const { token, user } = await registerAndLogin();
    expect(token).toBeTypeOf("string");
    expect(user.email).toBe("ana@test.dev");
  });

  it("rechaza emails duplicados con 409", async () => {
    await registerAndLogin();
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.dev", password: "secreto123" })
      .expect(409);
  });

  it("valida el formato del email con 422", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "no-es-un-email", password: "secreto123" })
      .expect(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("no devuelve el hash de la contraseña", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.dev", password: "secreto123" });
    expect(res.body.user).not.toHaveProperty("password");
  });
});

describe("POST /api/auth/login", () => {
  it("devuelve 401 con contraseña incorrecta", async () => {
    await registerAndLogin();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ana@test.dev", password: "incorrecta" })
      .expect(401);
    expect(res.body.error.message).toMatch(/credenciales/i);
  });
});

describe("GET /api/auth/me", () => {
  it("devuelve 401 sin token", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  it("devuelve el usuario con token válido", async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.user.email).toBe("ana@test.dev");
  });
});
