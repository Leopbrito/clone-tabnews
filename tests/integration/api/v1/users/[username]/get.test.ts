import { Feature } from "enums/feature.enum";
import { Orchestrator } from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await Orchestrator.createUser({
        username: "CaseMatch",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/CaseMatch",
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "CaseMatch",
        email: responseBody.email,
        features: [Feature.READ_ACTIVATION_TOTEN],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      await Orchestrator.createUser({
        username: "CaseMismatch",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/casemismatch",
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "CaseMismatch",
        email: responseBody.email,
        features: [Feature.READ_ACTIVATION_TOTEN],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With no existent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/InexistentUser",
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username foi digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
