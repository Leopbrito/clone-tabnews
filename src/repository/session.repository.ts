import { Database } from "infra/database";

export class SessionRepository {
  static async create(token, userId, expiresAt) {
    const result = await Database.query({
      text: `
        INSERT INTO 
          sessions (token, user_id, expires_at) 
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [token, userId, expiresAt],
    });
    return result.rows[0];
  }

  static async findOneValidByToken(token) {
    const result = await Database.query({
      text: `
        SELECT  
          * 
        FROM 
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT
          1
        ;`,
      values: [token],
    });
    return result.rows[0];
  }

  static async renewSession(id, expiresAt) {
    const result = await Database.query({
      text: `
        UPDATE 
          sessions 
        SET 
          expires_at = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [id, expiresAt],
    });
    return result.rows[0];
  }

  static async updateTokenAsExpired(id) {
    const result = await Database.query({
      text: `
        UPDATE 
          sessions 
        SET 
          expires_at = expires_at - interval '1 year',
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [id],
    });
    return result.rows[0];
  }
}
