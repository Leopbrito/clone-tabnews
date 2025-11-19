import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "models/password";

async function validateUniqueFields(userInputValues) {
  const { username = "", email = "" } = userInputValues;
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
      action:
        "Utilize outro 'username' ou 'email' para realizar está operação.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function create(userInputValues) {
  await validateUniqueFields(userInputValues);
  await hashPasswordInObject(userInputValues);

  const newUser = runInsertQuery(userInputValues);
  return newUser;

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

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
        SELECT  
          * 
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
      ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username foi digitado corretamente.",
      });
    }

    return result.rows[0];
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues || "email" in userInputValues) {
    await validateUniqueFields(userInputValues);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery({ id, username, email, password }) {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET 
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [id, username, email, password],
    });
    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
  update,
};

export default user;
