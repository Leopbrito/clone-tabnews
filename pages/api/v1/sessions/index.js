import {
  canRequest,
  clearSessionCookie,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
  setSessionCookie,
} from "infra/controller";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session from "models/session";

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

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  setSessionCookie(response, newSession.token);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const invalidatedSession = await session.expireById(sessionObject.id);
  clearSessionCookie(response);
  return response.status(200).json(invalidatedSession);
}
