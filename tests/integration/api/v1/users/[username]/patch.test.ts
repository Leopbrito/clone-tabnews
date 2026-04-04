import { Orchestrator } from "@tests/orchestrator";
import { version as uuidVersion } from "uuid";
import { User } from "@models/user";
import { Password } from "@models/password";
import { Feature } from "@enums/feature.enum";
import { WebServer } from "@infra/webserver";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      await Orchestrator.createUser({
        username: "uniqueUsername1AnonymousUser",
      });

      const response = await fetch(`${WebServer.origin}/api/v1/users/uniqueUsername1AnonymousUser`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueUsername2AnonymousUser",
        }),
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se seu usuario tem acesso a feature: update:user",
        message: "Usuario sem permisão.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await Orchestrator.createUser();
      const activatedUser = await Orchestrator.activateUser(createdUser);
      const sessionObject = await Orchestrator.createSession(activatedUser);

      const response = await fetch(`${WebServer.origin}/api/v1/users/InexistentUser`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          email: "contactAlterado@test.com",
        }),
      });
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username foi digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await Orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await Orchestrator.createUser({
        username: "user2",
      });
      const activatedUser2 = await Orchestrator.activateUser(createdUser2);
      const sessionObject2 = await Orchestrator.createSession(activatedUser2);

      const response = await fetch(`${WebServer.origin}/api/v1/users/user2`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "'username' ou 'email' já cadastrado ou invalidos",
        action: "Utilize outro 'username' ou 'email' para realizar está operação.",
        status_code: 400,
      });
    });

    test("With 'userB' targeting 'userA'", async () => {
      await Orchestrator.createUser({
        username: "userA",
      });

      const createdUserB = await Orchestrator.createUser({
        username: "userB",
      });
      const activatedUserB = await Orchestrator.activateUser(createdUserB);
      const sessionObjectB = await Orchestrator.createSession(activatedUserB);

      const response = await fetch(`${WebServer.origin}/api/v1/users/userA`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectB.token}`,
        },
        body: JSON.stringify({
          username: "userC",
        }),
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se voce possui a feature necessaria pra atualizar outro usuario.",
        message: "Voce não possui permissão para atualizar outro usuario.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated `email`", async () => {
      await Orchestrator.createUser({
        email: "email1@test.com",
      });

      const createdUser2 = await Orchestrator.createUser({
        email: "email2@test.com",
      });

      const activatedUser2 = await Orchestrator.activateUser(createdUser2);
      const sessionObject2 = await Orchestrator.createSession(activatedUser2);

      const response = await fetch(`${WebServer.origin}/api/v1/users/${createdUser2.username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          email: "email1@test.com",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "'username' ou 'email' já cadastrado ou invalidos",
        action: "Utilize outro 'username' ou 'email' para realizar está operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser = await Orchestrator.createUser({
        username: "uniqueUsername1",
      });

      const activatedUser = await Orchestrator.activateUser(createdUser);
      const sessionObject = await Orchestrator.createSession(activatedUser);

      const response = await fetch(`${WebServer.origin}/api/v1/users/uniqueUsername1`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          username: "uniqueUsername2",
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUsername2",
        features: [Feature.CREATE_SESSION, Feature.READ_SESSION, Feature.UPDATE_USER],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser = await Orchestrator.createUser({
        email: "unique.email1@test.com",
      });

      const activatedUser = await Orchestrator.activateUser(createdUser);
      const sessionObject = await Orchestrator.createSession(activatedUser);

      const response = await fetch(`${WebServer.origin}/api/v1/users/${createdUser.username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          email: "unique.email2@test.com",
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: responseBody.username,
        features: [Feature.CREATE_SESSION, Feature.READ_SESSION, Feature.UPDATE_USER],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await User.findOneByUsername(createdUser.username);

      expect(userInDatabase.email).toBe("unique.email2@test.com");
    });

    test("With new 'password'", async () => {
      const createdUser = await Orchestrator.createUser({
        password: "newPassword1",
      });

      const activatedUser = await Orchestrator.activateUser(createdUser);
      const sessionObject = await Orchestrator.createSession(activatedUser);

      const response = await fetch(`${WebServer.origin}/api/v1/users/${createdUser.username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          password: "newPassword2",
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: responseBody.username,
        features: [Feature.CREATE_SESSION, Feature.READ_SESSION, Feature.UPDATE_USER],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await User.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await Password.compare("newPassword2", userInDatabase.password);
      const incorrectPasswordMatch = await Password.compare("newPassword1", userInDatabase.password);
      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("With 'update:user:others' targeting 'defaultUser'", async () => {
      const privilegedUser = await Orchestrator.createUser();
      const activatedPrivilegedUser = await Orchestrator.activateUser(privilegedUser);
      await Orchestrator.addFeaturesToUser(privilegedUser, [Feature.UPDATE_USER_OTHERS]);

      const sessionObject = await Orchestrator.createSession(activatedPrivilegedUser);

      const defaultUser = await Orchestrator.createUser();
      const response = await fetch(`${WebServer.origin}/api/v1/users/${defaultUser.username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          username: `new${defaultUser.username}`,
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: `new${defaultUser.username}`,
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
