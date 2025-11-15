import database from "infra/database";
import { ValidationError } from "infra/errors";

async function create(userInputValues) {
  await validateUniqueFields(userInputValues);

  const newUser = runInsertQuery(userInputValues);
  return newUser;

  async function validateUniqueFields(userInputValues) {
    const { username, email } = userInputValues;
    const result = await database.query({
      text: `
        SELECT
          username, email 
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
        OR 
          LOWER(email) = LOWER($2)
      ;`,
      values: [username, email],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "'username' ou 'email' já cadastrado ou invalidos",
        action: "Utilize outro 'username' ou 'email' para realizar o cadastro.",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    const { username, email, password } = userInputValues;
    const result = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password) 
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [username, email, password],
    });
    return result.rows[0];
  }
}

const user = {
  create,
};

export default user;
