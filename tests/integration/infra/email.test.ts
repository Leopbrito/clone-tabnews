import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Sender <sender@test.com>",
      to: "recipient@test.com",
      subject: "Primeiro email",
      text: "corpo do primeiro email.",
    });

    await email.send({
      from: "Sender <sender@test.com>",
      to: "recipient@test.com",
      subject: "Segundo email",
      text: "corpo do segundo email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail).toEqual({
      id: 2,
      sender: "<sender@test.com>",
      recipients: ["<recipient@test.com>"],
      subject: "Segundo email",
      size: lastEmail.size,
      created_at: lastEmail.created_at,
      text: "corpo do segundo email.\n",
    });
  });
});
