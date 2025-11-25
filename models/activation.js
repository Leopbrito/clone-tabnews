import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webserver from "infra/webserver";

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

async function findOneByUserId(userId) {
  const activationTokenFound = await runSelectQuery(userId);
  return activationTokenFound;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `
        SELECT  
          * 
        FROM 
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT
          1
      ;`,
      values: [userId],
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
  findOneByUserId,
};

export default activation;
