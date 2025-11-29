import { Database } from "infra/database";

export class UserRepository {
  static async create(user) {
    const { username, email, password, features } = user;
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

  static async findOneById(id) {
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
    return result.rows[0];
  }

  static async findOneByUsername(username) {
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
    return result.rows[0];
  }

  static async findOneByEmail(email) {
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
    return result.rows[0];
  }

  static async findOneByUsernameOrEmail(username, email) {
    const result = await Database.query({
      text: `
        SELECT
          username, email 
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
          OR LOWER(email) = LOWER($2)
        LIMIT
          1
        ;`,
      values: [username, email],
    });
    return result.rows[0];
  }

  static async update(user) {
    const { id, username, email, password } = user;
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

  static async updateFeatures(id, features) {
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
      values: [id, features],
    });
    return result.rows[0];
  }
}
