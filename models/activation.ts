import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "models/user";
import authorization from "./authorization";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 Minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
  const activationToken = await runInsertQuery(userId, expiresAt);
  return activationToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
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

async function markTokenAsUsed(tokenId) {
  const activationToken = await runUpdateQuery(tokenId);
  return activationToken;

  async function runUpdateQuery(tokenId) {
    const result = await database.query({
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

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError();
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

async function findOneValidById(activationId) {
  const activationTokenFound = await runSelectQuery(activationId);
  return activationTokenFound;

  async function runSelectQuery(activationId) {
    const result = await database.query({
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

async function sendEmailToUser(createdUser, activationToken) {
  await email.send({
    from: "<contato@tabnews.com.br>",
    to: `${createdUser.email}`,
    subject: "Email de Ativação",
    text: `${createdUser.username}, clique no link abaixo para ativar sua conta:

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente
Tabnews`,
  });
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILISECONDS,
};

export default activation;
