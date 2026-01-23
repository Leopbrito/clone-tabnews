import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import { createRouter } from "next-connect";
import { User } from "models/user";
import { Feature } from "enums/feature.enum";

const router = createRouter();
router.use(injecAnonymousOrUser);
router.get(getHandler);
router.patch(canRequest(Feature.UPDATE_USER), patchHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(request, response) {
  const { username } = request.query;
  const userFound = await User.findOneByUsername(username);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const userInputValues = request.body;
  const updatedUser = await User.update(username, userInputValues);
  return response.status(200).json(updatedUser);
}
