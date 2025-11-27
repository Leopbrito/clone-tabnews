import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "infra/errors";
import session from "models/session";
import * as cookie from "cookie";
import user from "models/user";

export function onNoMatchHandler(request, response) {
  const publicObjectError = new MethodNotAllowedError();
  response.status(405).json(publicObjectError);
}

export function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.log(publicErrorObject);
  return response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

export function setSessionCookie(response, sessionToken) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

export function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

export async function injecAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
  } else {
    injectAnonymousUser(request);
  }
  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionTokenObject = await session.findOneValidByToken(sessionToken);
  const authenticatedUser = await user.findOneById(sessionTokenObject.user_id);
  request.context = {
    ...request.context,
    user: authenticatedUser,
  };
}

function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };
  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

export function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    if (userTryingToRequest.features.includes(feature)) {
      return next();
    }

    throw new ForbiddenError({
      action: `Verifique se seu usuario tem acesso a feature: ${feature}`,
    });
  };
}
