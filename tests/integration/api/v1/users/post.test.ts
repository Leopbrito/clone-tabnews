import { Orchestrator } from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import { Password } from "models/password";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validUser",
          email: "contact@test.com",
          password: "defaultPassword",
        }),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "validUser",
        email: "contact@test.com",
        features: ["read:activation_token"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("validUser");
      const correctPasswordMatch = await Password.compare(
        "defaultPassword",
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await Password.compare(
        "wrongPassword",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated `email`", async () => {
      await Orchestrator.createUser({
        email: "duplicated.email@test.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testUser",
          email: "Duplicated.email@test.com",
          password: "defaultPassword",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "'username' ou 'email' já cadastrado ou invalidos",
        action:
          "Utilize outro 'username' ou 'email' para realizar está operação.",
        status_code: 400,
      });
    });

    test("With duplicated `username`", async () => {
      await Orchestrator.createUser({
        username: "duplicatedUser",
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "DuplicatedUser",
          email: "duplicated.user@test.com",
          password: "defaultPassword",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "'username' ou 'email' já cadastrado ou invalidos",
        action:
          "Utilize outro 'username' ou 'email' para realizar está operação.",
        status_code: 400,
      });
    });
  });

  describe("Default User", () => {
    test("With unique and valid data", async () => {
      const user1 = await Orchestrator.createUser();
      await Orchestrator.activateUser(user1);
      const user1SessionObject = await Orchestrator.createSession(user1.id);

      const response = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "otherValidUser",
          email: "otherValidUser@test.com",
          password: "defaultPassword",
        }),
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se seu usuario tem acesso a feature: create:user",
        message: "Usuario sem permisão.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
