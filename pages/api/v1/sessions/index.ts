import {
  canRequest,
  clearSessionCookie,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
  setSessionCookie,
} from "infra/controller";
import { createRouter } from "next-connect";
import { Authentication } from "models/authentication";
import { Session } from "models/session";
import { Authorization } from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.post(canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await Authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!Authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError();
  }

  const newSession = await Session.create(authenticatedUser.id);

  setSessionCookie(response, newSession.token);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await Session.findOneValidByToken(sessionToken);
  const invalidatedSession = await Session.expireById(sessionObject.id);
  clearSessionCookie(response);
  return response.status(200).json(invalidatedSession);
}
