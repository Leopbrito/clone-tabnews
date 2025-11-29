import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import { createRouter } from "next-connect";
import { User } from "models/user";
import { Activation } from "models/activation";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.post(canRequest("create:user"), postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await User.create(userInputValues);
  const activationToken = await Activation.create(newUser.id);
  await Activation.sendEmailToUser(newUser, activationToken);
  return response.status(201).json(newUser);
}
