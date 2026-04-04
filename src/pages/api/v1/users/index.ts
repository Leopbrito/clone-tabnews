import { canRequest, injecAnonymousOrUser, onErrorHandler, onNoMatchHandler } from "@infra/controller";
import { createRouter } from "next-connect";
import { User } from "@models/user";
import { Activation } from "@models/activation";
import { Feature } from "@enums/feature.enum";
import { Authorization } from "@models/authorization";

export default createRouter()
  .use(injecAnonymousOrUser)
  .post(canRequest(Feature.CREATE_USER), postHandler)
  .handler({ onNoMatch: onNoMatchHandler, onError: onErrorHandler });

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const userInputValues = request.body;
  const newUser = await User.create(userInputValues);
  const activationToken = await Activation.create(newUser.id);
  await Activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = Authorization.filterOutput(userTryingToPost, Feature.READ_USER, newUser);

  return response.status(201).json(secureOutputValues);
}
