import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "infra/errors";
import { Session } from "models/session";
import * as cookie from "cookie";
import { User } from "models/user";
import { Authorization } from "models/authorization";

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
    maxAge: Session.EXPIRATION_IN_MILISECONDS / 1000,
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
  const sessionTokenObject = await Session.findOneValidByToken(sessionToken);
  const authenticatedUser = await User.findOneById(sessionTokenObject.user_id);
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

    if (Authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      action: `Verifique se seu usuario tem acesso a feature: ${feature}`,
    });
  };
}
