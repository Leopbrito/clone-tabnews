import activation from "models/activation";
import { User } from "models/user";
import { Orchestrator } from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token]", () => {
  describe("Anonymous user", () => {
    test("With no existent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/5262c110-f699-4ff5-b59e-9e7590567e6a",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        action: "Verifique se o id foi digitado corretamente.",
        message: "O id informado não foi encontrado no sistema.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILISECONDS),
      });

      const createdUser = await Orchestrator.createUser();
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        action: "Verifique se o id foi digitado corretamente.",
        message: "O id informado não foi encontrado no sistema.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await Orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response2.status).toBe(404);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "NotFoundError",
        action: "Verifique se o id foi digitado corretamente.",
        message: "O id informado não foi encontrado no sistema.",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await Orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: activationToken.id,
        user_id: activationToken.user_id,
        used_at: responseBody.used_at,
        created_at: activationToken.created_at.toISOString(),
        expires_at: activationToken.expires_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.used_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILISECONDS);

      const activatedUser = await User.findOneById(responseBody.user_id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await Orchestrator.createUser();
      await Orchestrator.activateUser(createdUser);
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se voce tem permisão de acesso a esse recurso.",
        message: "Usuario sem permisão.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With valid token, but already logged user", async () => {
      const user1 = await Orchestrator.createUser();
      await Orchestrator.activateUser(user1);
      const user1SessionObject = await Orchestrator.createSession(user1.id);

      const user2 = await Orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionObject.token}`,
          },
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          "Verifique se seu usuario tem acesso a feature: read:activation_token",
        message: "Usuario sem permisão.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
