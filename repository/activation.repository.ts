import { Database } from "infra/database";

export class ActivationRepository {
  static async create(userId, expiresAt) {
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

  static async findOneValidById(id) {
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
      values: [id],
    });
    return result.rows[0];
  }

  static async updateTokenAsUsed(id) {
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
      values: [id],
    });
    return result.rows[0];
  }
}
