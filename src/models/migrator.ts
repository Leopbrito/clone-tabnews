import { resolve } from "node:path";
import migrationRunner, { RunnerOption } from "node-pg-migrate";
import { Database } from "infra/database";

const defaultMigrationsOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};

export class Migrator {
  static async listPendingMigrations() {
    let dbClient;
    try {
      dbClient = await Database.getNewClient();

      const pendingMigrations = await migrationRunner({
        ...defaultMigrationsOptions,
        dbClient,
      } as RunnerOption);

      return pendingMigrations;
    } finally {
      await dbClient?.end();
    }
  }

  static async runPendingMigrations() {
    let dbClient;
    try {
      dbClient = await Database.getNewClient();

      const migratedMigrations = await migrationRunner({
        ...defaultMigrationsOptions,
        dbClient,
        dryRun: false,
      } as RunnerOption);

      return migratedMigrations;
    } finally {
      await dbClient?.end();
    }
  }
}
