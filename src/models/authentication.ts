import { User } from "@models/user";
import { Password } from "@models/password";
import { NotFoundError, UnauthorizedError } from "@infra/errors";

export class Authentication {
  static async getUser(providedEmail: string, providedPassword: string) {
    try {
      const storedUser = await findUserByEmail(providedEmail);
      await validatePassword(providedPassword, storedUser.password);
      return storedUser;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw new UnauthorizedError({
          message: "Os dados de autenticação não conferem.",
          action: "Verifique se os dados enviados estão corretos.",
        });
      }

      throw error;
    }

    async function findUserByEmail(providedEmail: string) {
      try {
        return await User.findOneByEmail(providedEmail);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new UnauthorizedError({
            message: "Email não confere.",
            action: "Verifique se esse dado está correto.",
          });
        }

        throw error;
      }
    }

    async function validatePassword(providedPassword: string, storedPassword: string) {
      const correctPasswordMatch = await Password.compare(providedPassword, storedPassword);

      if (!correctPasswordMatch) {
        throw new UnauthorizedError({
          message: "Senha não confere.",
          action: "Verifique se esse dado está correto.",
        });
      }
    }
  }
}
