import { canRequest, injecAnonymousOrUser, onErrorHandler, onNoMatchHandler } from "infra/controller";
import { Migrator } from "src/models/migrator";
import { createRouter } from "next-connect";
import { Feature } from "src/enums/feature.enum";
import { Authorization } from "src/models/authorization";

const router = createRouter();

router.use(injecAnonymousOrUser);
router.get(canRequest(Feature.READ_MIGRATION), getHandler);
router.post(canRequest(Feature.CREATE_MIGRATION), postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(request, response) {
  const { user } = request.context;
  const pendingMigrations = await Migrator.listPendingMigrations();

  const secureOutputValues = Authorization.filterOutput(user, Feature.READ_MIGRATION, pendingMigrations);
  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const { user } = request.context;

  const migratedMigrations = await Migrator.runPendingMigrations();
  const statusCode = migratedMigrations.length > 0 ? 201 : 200;

  const secureOutputValues = Authorization.filterOutput(user, Feature.READ_MIGRATION, migratedMigrations);

  return response.status(statusCode).json(secureOutputValues);
}
