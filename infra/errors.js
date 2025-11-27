class BaseError extends Error {
  constructor({ message, cause, statusCode, action, name }) {
    super(message, { cause });
    this.name = name;
    this.statusCode = statusCode;
    this.action = action;
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
  constructor({ cause, statusCode }) {
    super({
      message: "Um erro interno não esperado aconteceu",
      name: "InternalServerError",
      action: "Entre em contato com o suporte.",
      statusCode: statusCode || 500,
      cause,
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
  constructor({ message, cause }) {
    super({
      message: message || "Um erro interno não esperado aconteceu",
      name: "ServiceError",
      action: "Verifique se o serviço está disponivel.",
      statusCode: 503,
      cause,
    });
  }
}

export class ValidationError extends BaseError {
  constructor({ cause, message, action }) {
    super({
      message: message || "Um erro de validação aconteceu.",
      name: "ValidationError",
      action: action || "Ajuste os dados enviados e tente novamente.",
      statusCode: 400,
      cause,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor({ message, action }) {
    super({
      message: message || "Não foi possivel encontrar esse recurso no sistema",
      name: "NotFoundError",
      action: action || "Verifique se os parametros do recurso estão corretos",
      statusCode: 404,
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor({ message, action }) {
    super({
      message: message || "Usuario não autenticado.",
      name: "UnauthorizedError",
      action: action || "Faça o login novamente.",
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends BaseError {
  constructor({ message, action }) {
    super({
      message: message || "Usuario sem permisão.",
      name: "ForbiddenError",
      action:
        action || "Verifique se voce tem permisão de acesso a esse recurso.",
      statusCode: 403,
    });
  }
}
