import { Database } from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import { Password } from "models/password";

export class User {
  static async validateUniqueFields(userInputValues) {
    const { username = "", email = "" } = userInputValues;
    const result = await Database.query({
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

  static async hashPasswordInObject(userInputValues) {
    const hashedPassword = await Password.hash(userInputValues.password);
    userInputValues.password = hashedPassword;
  }

  static async create(userInputValues) {
    await this.validateUniqueFields(userInputValues);
    await this.hashPasswordInObject(userInputValues);
    injectDefaultFeaturesInObject(userInputValues);

    const newUser = runInsertQuery(userInputValues);
    return newUser;

    async function runInsertQuery(userInputValues) {
      const { username, email, password, features } = userInputValues;
      const result = await Database.query({
        text: `
          INSERT INTO 
            users (username, email, password, features) 
          VALUES 
            ($1, $2, $3, $4)
          RETURNING
            *
        ;`,
        values: [username, email, password, features],
      });
      return result.rows[0];
    }

    function injectDefaultFeaturesInObject(userInputValues) {
      userInputValues.features = ["read:activation_token"];
    }
  }

  static async findOneByUsername(username) {
    const userFound = await runSelectQuery(username);
    return userFound;

    async function runSelectQuery(username) {
      const result = await Database.query({
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

  static async findOneByEmail(email) {
    const userFound = await runSelectQuery(email);
    return userFound;

    async function runSelectQuery(email) {
      const result = await Database.query({
        text: `
          SELECT  
            * 
          FROM 
            users
          WHERE
            LOWER(email) = LOWER($1)
          LIMIT
            1
        ;`,
        values: [email],
      });

      if (result.rowCount === 0) {
        throw new NotFoundError({
          message: "O email informado não foi encontrado no sistema.",
          action: "Verifique se o email foi digitado corretamente.",
        });
      }

      return result.rows[0];
    }
  }

  static async findOneById(id) {
    const userFound = await runSelectQuery(id);
    return userFound;

    async function runSelectQuery(id) {
      const result = await Database.query({
        text: `
          SELECT  
            * 
          FROM 
            users
          WHERE
            id = $1
          LIMIT
            1
        ;`,
        values: [id],
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

  static async update(username, userInputValues) {
    const currentUser = await this.findOneByUsername(username);

    if ("username" in userInputValues || "email" in userInputValues) {
      await this.validateUniqueFields(userInputValues);
    }

    if ("password" in userInputValues) {
      await this.hashPasswordInObject(userInputValues);
    }

    const userWithNewValues = { ...currentUser, ...userInputValues };

    const updatedUser = await runUpdateQuery(userWithNewValues);
    return updatedUser;

    async function runUpdateQuery({ id, username, email, password }) {
      const result = await Database.query({
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

  static async setFeatures(userId, features) {
    const userWithFeatures = await runUpdateQuery(userId, features);
    return userWithFeatures;

    async function runUpdateQuery(userId, features) {
      const result = await Database.query({
        text: `
          UPDATE 
            users 
          SET 
            features = $2,
            updated_at = timezone('utc', now())
          WHERE
            id = $1
          RETURNING
            *
        ;`,
        values: [userId, features],
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
}
