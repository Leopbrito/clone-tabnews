import { createRouter } from "next-connect";
import { Database } from "infra/database";
import { injecAnonymousOrUser, onErrorHandler, onNoMatchHandler } from "infra/controller";
import { Authorization } from "src/models/authorization";
import { Feature } from "src/enums/feature.enum";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(request, response) {
  const { user } = request.context;
  const updatedAt = new Date().toISOString();

  const databaseVersionResult = await Database.query("SHOW server_version;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMaxConnectionsResult = await Database.query("SHOW max_connections;");
  const databaseMaxConnectionsValue = databaseMaxConnectionsResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsResult = await Database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const databaseOpenedConnectionsValue = databaseOpenedConnectionsResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  };

  const secureOutputValues = Authorization.filterOutput(user, Feature.READ_STATUS, statusObject);

  return response.status(200).json(secureOutputValues);
}
