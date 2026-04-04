import { WebServer } from "@infra/webserver";
import { Orchestrator } from "@tests/orchestrator";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving application status", async () => {
      const response = await fetch(`${WebServer.origin}/api/v1/status`, {
        method: "POST",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Método não permitido para este endpont.",
        action: "Verifique se o método HTTP enviado é válido para este endpoint.",
        status_code: 405,
      });
    });
  });
});
