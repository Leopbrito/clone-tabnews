import { canRequest, injecAnonymousOrUser, onErrorHandler, onNoMatchHandler } from "infra/controller";
import { createRouter } from "next-connect";
import { User } from "src/models/user";
import { Feature } from "src/enums/feature.enum";
import { Authorization } from "src/models/authorization";
import { ForbiddenError } from "infra/errors";

export default createRouter()
  .use(injecAnonymousOrUser)
  .get(getHandler)
  .patch(canRequest(Feature.UPDATE_USER), patchHandler)
  .handler({ onNoMatch: onNoMatchHandler, onError: onErrorHandler });

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const { username } = request.query;
  const userFound = await User.findOneByUsername(username);
  const secureOutputValues = Authorization.filterOutput(userTryingToGet, Feature.READ_USER, userFound);
  return response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await User.findOneByUsername(username);

  if (!Authorization.can(userTryingToPatch, Feature.UPDATE_USER, targetUser)) {
    throw new ForbiddenError({
      message: "Voce não possui permissão para atualizar outro usuario.",
      action: "Verifique se voce possui a feature necessaria pra atualizar outro usuario.",
    });
  }

  const updatedUser = await User.update(username, userInputValues);

  const secureOutputValues = Authorization.filterOutput(userTryingToPatch, Feature.READ_USER, updatedUser);

  return response.status(200).json(secureOutputValues);
}
