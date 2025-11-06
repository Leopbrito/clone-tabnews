import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(req, res) {
  let test;
  const allowedMethod = ["GET", "POST"];
  if (!allowedMethod.includes(req.method)) {
    return res.status(405).end();
  }
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationsOptions = {
      dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (req.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationsOptions);
      return res.status(200).json(pendingMigrations);
    }

    if (req.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationsOptions,
        dryRun: false,
      });
      if (migratedMigrations.length > 0) {
        return res.status(201).json(migratedMigrations);
      }

      return res.status(200).json(migratedMigrations);
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
