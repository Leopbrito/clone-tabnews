import { onErrorHandler, onNoMatchHandler } from "infra/controller";
import { createRouter } from "next-connect";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function patchHandler(request, response) {
  const { token } = request.query;

  const usedActivationTokenObject = await activation.markTokenAsUsed(token);
  await activation.activateUserByUserId(usedActivationTokenObject.user_id);

  return response.status(200).json(usedActivationTokenObject);
}
