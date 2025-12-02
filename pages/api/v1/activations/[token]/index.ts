import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import { createRouter } from "next-connect";
import { Activation } from "models/activation";
import { Feature } from "enums/feature.enum";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.patch(canRequest(Feature.READ_ACTIVATION_TOTEN), patchHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function patchHandler(request, response) {
  const { token } = request.query;

  const validActivationToken = await Activation.findOneValidById(token);

  await Activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationTokenObject = await Activation.markTokenAsUsed(token);

  return response.status(200).json(usedActivationTokenObject);
}
