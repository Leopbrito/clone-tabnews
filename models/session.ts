import crypto from "node:crypto";
import { UnauthorizedError } from "infra/errors";
import { SessionRepository } from "repository/session.repository";

export class Session {
  static EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days

  static async renew(sessionId) {
    const expiresAt = new Date(Date.now() + this.EXPIRATION_IN_MILISECONDS);
    return await SessionRepository.renewSession(sessionId, expiresAt);
  }

  static async expireById(sessionId) {
    return await SessionRepository.updateTokenAsExpired(sessionId);
  }

  static async create(userId) {
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + this.EXPIRATION_IN_MILISECONDS);
    return await SessionRepository.create(token, userId, expiresAt);
  }

  static async findOneValidByToken(sessionToken) {
    const sessionFound =
      await SessionRepository.findOneValidByToken(sessionToken);

    if (!sessionFound) {
      throw new UnauthorizedError({
        message: "Os dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    }

    return sessionFound;
  }
}
