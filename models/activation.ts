import { Email } from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import { WebServer } from "infra/webserver";
import { User } from "models/user";
import { Authorization } from "./authorization";
import { ActivationRepository } from "repository/activation.repository";
import { Feature } from "enums/feature.enum";

const activationEmailTemplate = (username: string, activationToken: string) => {
  return `${username}, clique no link abaixo para ativar sua conta:

${WebServer.origin}/cadastro/ativar/${activationToken}

Atenciosamente
Tabnews`;
};

export class Activation {
  static EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 Minutes

  static async create(userId) {
    const expiresAt = new Date(Date.now() + this.EXPIRATION_IN_MILISECONDS);
    return await ActivationRepository.create(userId, expiresAt);
  }

  static async markTokenAsUsed(tokenId) {
    const activationToken =
      await ActivationRepository.updateTokenAsUsed(tokenId);
    return activationToken;
  }

  static async activateUserByUserId(userId) {
    const userToActivate = await User.findOneById(userId);

    if (!Authorization.can(userToActivate, Feature.READ_ACTIVATION_TOTEN)) {
      throw new ForbiddenError();
    }

    const activatedUser = await User.setFeatures(userId, [
      Feature.CREATE_SESSION,
      Feature.READ_SESSION,
    ]);
    return activatedUser;
  }

  static async findOneValidById(activationId) {
    const activationTokenFound =
      await ActivationRepository.findOneValidById(activationId);
    if (!activationTokenFound) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id foi digitado corretamente.",
      });
    }
    return activationTokenFound;
  }

  static async sendEmailToUser(user, activationToken) {
    await Email.send({
      from: "<contato@tabnews.com.br>",
      to: `${user.email}`,
      subject: "Email de Ativação",
      text: activationEmailTemplate(user.username, activationToken.id),
    });
  }
}
