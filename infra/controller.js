import { InternalServerError, MethodNotAllowedError } from "infra/errors";

export function onNoMatchHandler(request, response) {
  const publicObjectError = new MethodNotAllowedError();
  response.status(405).json(publicObjectError);
}

export function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });
  console.log(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}
