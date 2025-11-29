import { Database } from "infra/database";
import { Email } from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import { User } from "models/user";
import { Authorization } from "./authorization";

const activationEmailTemplate = (username: string, activationToken: string) => {
  return `${username}, clique no link abaixo para ativar sua conta:

${webserver.origin}/cadastro/ativar/${activationToken}

Atenciosamente
Tabnews`;
};

export class Activation {
  static EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 Minutes

  static async create(userId) {
    const expiresAt = new Date(Date.now() + this.EXPIRATION_IN_MILISECONDS);
    const activationToken = await runInsertQuery(userId, expiresAt);
    return activationToken;

    async function runInsertQuery(userId, expiresAt) {
      const result = await Database.query({
        text: `
          INSERT INTO 
            user_activation_tokens (user_id, expires_at) 
          VALUES 
            ($1, $2)
          RETURNING
            *
        ;`,
        values: [userId, expiresAt],
      });
      return result.rows[0];
    }
  }

  static async markTokenAsUsed(tokenId) {
    const activationToken = await runUpdateQuery(tokenId);
    return activationToken;

    async function runUpdateQuery(tokenId) {
      const result = await Database.query({
        text: `
          UPDATE 
            user_activation_tokens 
          SET 
            used_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
          WHERE
            id = $1
            AND expires_at > NOW()
            AND used_at IS NULL
          RETURNING
            *
        ;`,
        values: [tokenId],
      });
      return result.rows[0];
    }
  }

  static async activateUserByUserId(userId) {
    const userToActivate = await User.findOneById(userId);

    if (!Authorization.can(userToActivate, "read:activation_token")) {
      throw new ForbiddenError();
    }

    const activatedUser = await User.setFeatures(userId, [
      "create:session",
      "read:session",
    ]);
    return activatedUser;
  }

  static async findOneValidById(activationId) {
    const activationTokenFound = await runSelectQuery(activationId);
    return activationTokenFound;

    async function runSelectQuery(activationId) {
      const result = await Database.query({
        text: `
          SELECT  
            * 
          FROM 
            user_activation_tokens
          WHERE
            id = $1
            AND expires_at > NOW()
            AND used_at IS NULL
          LIMIT
            1
        ;`,
        values: [activationId],
      });

      if (result.rowCount === 0) {
        throw new NotFoundError({
          message: "O id informado não foi encontrado no sistema.",
          action: "Verifique se o id foi digitado corretamente.",
        });
      }

      return result.rows[0];
    }
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
