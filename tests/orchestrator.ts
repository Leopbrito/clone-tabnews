import retry from "async-retry";
import { Database } from "infra/database";
import { Migrator } from "models/migrator";
import { User } from "models/user";
import { faker } from "@faker-js/faker";
import session from "models/session";
import { Activation } from "models/activation";

const EMAIL_HTTP_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

export class Orchestrator {
  static async waitForAllServices() {
    await waitForWebServer();
    await waitForEmailServer();

    async function waitForWebServer() {
      return retry(fetchStatusPage, {
        retries: 100,
        maxTimeout: 1000,
      });

      async function fetchStatusPage() {
        const response = await fetch("http://localhost:3000/api/v1/status");
        if (response.status !== 200) {
          throw Error();
        }
      }
    }

    async function waitForEmailServer() {
      return retry(fetchEmailPage, {
        retries: 100,
        maxTimeout: 1000,
      });

      async function fetchEmailPage() {
        const response = await fetch(EMAIL_HTTP_URL);
        if (response.status !== 200) {
          throw Error();
        }
      }
    }
  }

  static async clearDatabase() {
    await Database.query("drop schema public cascade; create schema public;");
  }

  static async runPendingMigrations() {
    await Migrator.runPendingMigrations();
  }

  static async createUser(userInputValues) {
    return await User.create({
      username:
        userInputValues?.username ||
        faker.internet.username().replace(/[_.-]/g, ""),
      email: userInputValues?.email || faker.internet.email(),
      password: userInputValues?.password || "defaultPassword",
    });
  }

  static async createSession(userId) {
    return await session.create(userId);
  }

  static async deleteAllEmails() {
    await fetch(`${EMAIL_HTTP_URL}/messages`, {
      method: "DELETE",
    });
  }

  static async activateUser(inactivatedUser) {
    return await Activation.activateUserByUserId(inactivatedUser.id);
  }

  static async getLastEmail() {
    const emailListResponse = await fetch(`${EMAIL_HTTP_URL}/messages`, {});
    const emailListBody = await emailListResponse.json();
    const lastEmailItem = emailListBody.pop();
    if (!lastEmailItem) {
      return null;
    }
    const lastEmailTextResponse = await fetch(
      `${EMAIL_HTTP_URL}/messages/${lastEmailItem.id}.plain`,
    );
    const lastEmailTextBody = await lastEmailTextResponse.text();
    return {
      ...lastEmailItem,
      text: lastEmailTextBody,
    };
  }
}
