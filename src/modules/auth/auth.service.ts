import { prisma } from "../../lib/prisma.js";
import { conflict, unauthorized } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signToken } from "../../lib/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const publicUser = { id: true, name: true, email: true, role: true, createdAt: true } as const;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict("Ya existe una cuenta con ese email");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
    },
    select: publicUser,
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Mismo mensaje para email inexistente y contraseña incorrecta: no damos pistas.
  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw unauthorized("Credenciales incorrectas");
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    token,
  };
}

export function me(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUser });
}
