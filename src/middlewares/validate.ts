import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Valida y *limpia* el body con un esquema Zod.
 * El controlador recibe datos ya tipados y sin campos desconocidos.
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
