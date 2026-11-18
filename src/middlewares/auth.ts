import type { Request, Response, NextFunction } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyToken } from "../lib/jwt.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Exige un `Authorization: Bearer <token>` válido y deja el usuario en `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Falta la cabecera Authorization: Bearer <token>");
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw unauthorized("Token inválido o caducado");
  }
}

/** Restringe una ruta a determinados roles (se usa después de requireAuth). */
export function requireRole(...roles: Array<AuthUser["role"]>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) {
      throw unauthorized("No tienes permisos suficientes");
    }
    next();
  };
}
