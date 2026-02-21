import {
  canRequest,
  injecAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import { createRouter } from "next-connect";
import { Activation } from "src/models/activation";
import { Feature } from "src/enums/feature.enum";
import { Authorization } from "src/models/authorization";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.patch(canRequest(Feature.READ_ACTIVATION_TOKEN), patchHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function patchHandler(request, response) {
  const { user } = request.context;
  const { token } = request.query;

  const validActivationToken = await Activation.findOneValidById(token);

  await Activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationTokenObject = await Activation.markTokenAsUsed(token);

  const secureOutputValues = Authorization.filterOutput(
    user,
    Feature.READ_ACTIVATION_TOKEN,
    usedActivationTokenObject,
  );

  return response.status(200).json(secureOutputValues);
}
