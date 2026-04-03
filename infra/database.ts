import { Client } from "pg";
import { ServiceError } from "./errors";

export class Database {
  static async query(queryObject) {
    let client;
    try {
      client = await this.getNewClient();
      const result = await client.query(queryObject);
      return result;
    } catch (error) {
      const serviceErrorObject = new ServiceError({
        message: "Erro na conexão com o Banco ou na Query.",
        cause: error,
      });
      throw serviceErrorObject;
    } finally {
      await client?.end();
    }
  }

  static async getNewClient() {
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.NODE_ENV === "production",
    });

    await client.connect();
    return client;
  }
}
