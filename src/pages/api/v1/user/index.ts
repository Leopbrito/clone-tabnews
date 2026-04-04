import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
  setSessionCookie,
} from "@infra/controller";
import { createRouter } from "next-connect";
import { Session } from "@models/session";
import { User } from "@models/user";
import { Feature } from "@enums/feature.enum";
import { Authorization } from "@models/authorization";

export default createRouter()
  .use(injecAnonymousOrUser)
  .get(canRequest(Feature.READ_SESSION), getHandler)
  .handler({ onNoMatch: onNoMatchHandler, onError: onErrorHandler });

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const sessionToken = request.cookies.session_id;
  const sessionObject = await Session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await Session.renew(sessionObject.id);
  setSessionCookie(response, renewedSessionObject.token);
  response.setHeader("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");

  const userFound = await User.findOneById(renewedSessionObject.user_id);

  const secureOutputValues = Authorization.filterOutput(userTryingToGet, Feature.READ_USER_SELF, userFound);

  return response.status(200).json(secureOutputValues);
}
