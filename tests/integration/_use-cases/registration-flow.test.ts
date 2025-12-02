import { Feature } from "enums/feature.enum";
import { WebServer } from "infra/webserver";
import { Activation } from "models/activation";
import { User } from "models/user";
import { Orchestrator } from "tests/orchestrator";

beforeAll(async () => {
  await Orchestrator.waitForAllServices();
  await Orchestrator.clearDatabase();
  await Orchestrator.runPendingMigrations();
  await Orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let activationTokenId;
  let createSessionResponseBody;
  test("create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlowUser",
          email: "registration.flow@test.com",
          password: "RegistrationFlowPassword",
        }),
      },
    );
    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlowUser",
      email: "registration.flow@test.com",
      features: [Feature.READ_ACTIVATION_TOTEN],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await Orchestrator.getLastEmail();

    [activationTokenId] = lastEmail.text.match(/[0-9a-fA-F-]{36}/g);

    expect(lastEmail).toEqual({
      id: lastEmail.id,
      sender: "<contato@tabnews.com.br>",
      recipients: ["<registration.flow@test.com>"],
      subject: "Email de Ativação",
      size: lastEmail.size,
      created_at: lastEmail.created_at,
      text: lastEmail.text,
    });
    expect(lastEmail.text).toContain("RegistrationFlowUser");
    expect(lastEmail.text).toContain(
      `${WebServer.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await Activation.findOneValidById(activationTokenId);

    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    console.log(activationTokenId);

    expect(activationResponse.status).toBe(200);
    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await User.findOneByUsername("RegistrationFlowUser");
    expect(activatedUser.features).toEqual([
      Feature.CREATE_SESSION,
      Feature.READ_SESSION,
    ]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@test.com",
          password: "RegistrationFlowPassword",
        }),
      },
    );
    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createUserResponseBody.id);
  });

  test("Get user information", async () => {
    const userResponse = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });
    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();

    expect(userResponseBody.id).toBe(createUserResponseBody.id);
  });
});
