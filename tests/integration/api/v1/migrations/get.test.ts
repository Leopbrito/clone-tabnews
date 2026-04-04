import { WebServer } from "infra/webserver";
import { Feature } from "src/enums/feature.enum";
import { Orchestrator } from "tests/orchestrator";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pendings migrations", async () => {
      const response = await fetch(`${WebServer.origin}/api/v1/migrations`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se seu usuario tem acesso a feature: read:migration",
        message: "Usuario sem permisão.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pendings migrations", async () => {
      const sessionObject = await Orchestrator.createSessionFromActivatedUser();
      const response = await fetch(`${WebServer.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se seu usuario tem acesso a feature: read:migration",
        message: "Usuario sem permisão.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pendings migrations", async () => {
      const createdUser = await Orchestrator.createUser();
      const activatedUser = await Orchestrator.activateUser(createdUser);
      await Orchestrator.addFeaturesToUser(activatedUser, [Feature.READ_MIGRATION]);
      const sessionObject = await Orchestrator.createSession(activatedUser);
      const response = await fetch(`${WebServer.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
