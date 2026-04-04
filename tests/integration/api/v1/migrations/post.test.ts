import { WebServer } from "@infra/webserver";
import { Feature } from "@enums/feature.enum";
import { Orchestrator } from "@tests/orchestrator";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(`${WebServer.origin}/api/v1/migrations`, {
          method: "POST",
        });
        expect(response.status).toBe(403);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          action: "Verifique se seu usuario tem acesso a feature: create:migration",
          message: "Usuario sem permisão.",
          name: "ForbiddenError",
          status_code: 403,
        });
      });
    });
  });
  describe("Default user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const sessionObject = await Orchestrator.createSessionFromActivatedUser();
        const response = await fetch(`${WebServer.origin}/api/v1/migrations`, {
          method: "POST",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });
        expect(response.status).toBe(403);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          action: "Verifique se seu usuario tem acesso a feature: create:migration",
          message: "Usuario sem permisão.",
          name: "ForbiddenError",
          status_code: 403,
        });
      });
    });
  });
  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      let sessionObject;
      test("For the first time", async () => {
        sessionObject = await Orchestrator.createSessionFromActivatedUser({
          userFeatures: [Feature.CREATE_MIGRATION],
        });
        const response1 = await fetch(`${WebServer.origin}/api/v1/migrations`, {
          method: "POST",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });
        expect(response1.status).toBe(200);

        const responseBody1 = await response1.json();

        expect(Array.isArray(responseBody1)).toBe(true);
      });
    });
  });
});
