import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import { createRouter } from "next-connect";
import { User } from "src/models/user";
import { Activation } from "src/models/activation";
import { Feature } from "src/enums/feature.enum";
import { Authorization } from "src/models/authorization";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.post(canRequest(Feature.CREATE_USER), postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const userInputValues = request.body;
  const newUser = await User.create(userInputValues);
  const activationToken = await Activation.create(newUser.id);
  await Activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = Authorization.filterOutput(
    userTryingToPost,
    Feature.READ_USER,
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
