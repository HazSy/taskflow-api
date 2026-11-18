/**
 * Error de aplicación con código HTTP.
 * El middleware de errores lo traduce a una respuesta JSON uniforme.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code = "ERROR", details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg = "Petición inválida", details?: unknown) =>
  new HttpError(400, msg, "BAD_REQUEST", details);

export const unauthorized = (msg = "No autenticado") =>
  new HttpError(401, msg, "UNAUTHORIZED");

export const forbidden = (msg = "No tienes permisos sobre este recurso") =>
  new HttpError(403, msg, "FORBIDDEN");

export const notFound = (msg = "Recurso no encontrado") =>
  new HttpError(404, msg, "NOT_FOUND");

export const conflict = (msg = "El recurso ya existe") =>
  new HttpError(409, msg, "CONFLICT");
