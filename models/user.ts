import { NotFoundError, ValidationError } from "infra/errors";
import { Password } from "models/password";
import { UserRepository } from "repository/user.repository";

export class User {
  static async validateUniqueFields(userInputValues) {
    const { username = "", email = "" } = userInputValues;
    const userFound = await UserRepository.findOneByUsernameOrEmail(
      username,
      email,
    );
    if (userFound) {
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

    const newUser = await UserRepository.create(userInputValues);
    return newUser;

    function injectDefaultFeaturesInObject(userInputValues) {
      userInputValues.features = ["read:activation_token"];
    }
  }

  static async findOneById(id) {
    const userFound = await UserRepository.findOneById(id);
    if (!userFound) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id foi digitado corretamente.",
      });
    }
    return userFound;
  }

  static async findOneByUsername(username) {
    const userFound = await UserRepository.findOneByUsername(username);
    if (!userFound) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username foi digitado corretamente.",
      });
    }
    return userFound;
  }

  static async findOneByEmail(email) {
    const userFound = await UserRepository.findOneByEmail(email);
    if (!userFound) {
      throw new NotFoundError({
        message: "O email informado não foi encontrado no sistema.",
        action: "Verifique se o email foi digitado corretamente.",
      });
    }
    return userFound;
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

    const updatedUser = await UserRepository.update(userWithNewValues);
    return updatedUser;
  }

  static async setFeatures(id, features) {
    const userWithFeatures = await UserRepository.updateFeatures(id, features);
    if (!userWithFeatures) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id foi digitado corretamente.",
      });
    }
    return userWithFeatures;
  }
}
