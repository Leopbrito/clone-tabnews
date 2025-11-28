import { onErrorHandler, onNoMatchHandler } from "infra/controller";
import { createRouter } from "next-connect";
import { User } from "models/user";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

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
