import {
  canRequest,
  clearSessionCookie,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
  setSessionCookie,
} from "infra/controller";
import { createRouter } from "next-connect";
import { Authentication } from "src/models/authentication";
import { Session } from "src/models/session";
import { Authorization } from "src/models/authorization";
import { ForbiddenError } from "infra/errors";
import { Feature } from "src/enums/feature.enum";

export default createRouter()
  .use(injecAnonymousOrUser)
  .post(canRequest(Feature.CREATE_SESSION), postHandler)
  .delete(deleteHandler)
  .handler({ onNoMatch: onNoMatchHandler, onError: onErrorHandler });

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await Authentication.getUser(userInputValues.email, userInputValues.password);

  if (!Authorization.can(authenticatedUser, Feature.CREATE_SESSION)) {
    throw new ForbiddenError();
  }

  const newSession = await Session.create(authenticatedUser.id);

  setSessionCookie(response, newSession.token);

  const secureOutputValues = Authorization.filterOutput(authenticatedUser, Feature.READ_SESSION, newSession);

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;
  const sessionToken = request.cookies.session_id;
  const sessionObject = await Session.findOneValidByToken(sessionToken);
  const invalidatedSession = await Session.expireById(sessionObject.id);
  clearSessionCookie(response);

  const secureOutputValues = Authorization.filterOutput(userTryingToDelete, Feature.READ_SESSION, invalidatedSession);
  return response.status(200).json(secureOutputValues);
}
