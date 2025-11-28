import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
  setSessionCookie,
} from "infra/controller";
import { createRouter } from "next-connect";
import session from "models/session";
import { User } from "models/user";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.get(canRequest("read:session"), getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  setSessionCookie(response, renewedSessionObject.token);
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const userFound = await User.findOneById(renewedSessionObject.user_id);
  return response.status(200).json(userFound);
}
