export interface BaseErrorConstructor {
  name: string;
  message: string;
  action: string;
  statusCode: number;
  cause?: string;
}

abstract class BaseError extends Error {
  statusCode: number;
  action: string;

  constructor(error: BaseErrorConstructor) {
    super(error.message, { cause: error.cause });
    this.name = error.name;
    this.statusCode = error.statusCode;
    this.action = error.action;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class InternalServerError extends BaseError {
  constructor(error?: { cause?: string }) {
    super({
      message: "Um erro interno não esperado aconteceu",
      name: "InternalServerError",
      action: "Entre em contato com o suporte.",
      statusCode: 500,
      cause: error.cause,
    });
  }
}

export class MethodNotAllowedError extends BaseError {
  constructor() {
    super({
      message: "Método não permitido para este endpont.",
      name: "MethodNotAllowedError",
      action: "Verifique se o método HTTP enviado é válido para este endpoint.",
      statusCode: 405,
    });
  }
}

export class ServiceError extends BaseError {
  constructor(error?: { cause?: string; message?: string }) {
    super({
      message: error?.message || "Um erro interno não esperado aconteceu",
      name: "ServiceError",
      action: "Verifique se o serviço está disponivel.",
      statusCode: 503,
      cause: error?.cause,
    });
  }
}

export class ValidationError extends BaseError {
  constructor(error?: { cause?: string; message?: string; action?: string }) {
    super({
      message: error?.message || "Um erro de validação aconteceu.",
      name: "ValidationError",
      action: error?.action || "Ajuste os dados enviados e tente novamente.",
      statusCode: 400,
      cause: error?.cause,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor(error?: { message?: string; action?: string }) {
    super({
      message:
        error?.message || "Não foi possivel encontrar esse recurso no sistema",
      name: "NotFoundError",
      action:
        error?.action || "Verifique se os parametros do recurso estão corretos",
      statusCode: 404,
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor(error?: { message?: string; action?: string }) {
    super({
      message: error?.message || "Usuario não autenticado.",
      name: "UnauthorizedError",
      action: error?.action || "Faça o login novamente.",
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends BaseError {
  constructor(error?: { message?: string; action?: string }) {
    super({
      message: error?.message || "Usuario sem permisão.",
      name: "ForbiddenError",
      action:
        error?.action ||
        "Verifique se voce tem permisão de acesso a esse recurso.",
      statusCode: 403,
    });
  }
}
