import { InternalServerError } from "infra/errors";
import { Feature } from "src/enums/feature.enum";

export class Authorization {
  static can(user, feature, resource?) {
    this.validateUser(user);
    this.validateFeature(feature);

    let authorized = false;

    if (user.features.includes(feature)) {
      authorized = true;
    }

    if (feature === Feature.UPDATE_USER && resource) {
      authorized = false;

      if (user.id === resource.id || this.can(user, Feature.UPDATE_USER_OTHERS)) {
        authorized = true;
      }
    }

    return authorized;
  }

  static filterOutput(user, feature, resource) {
    this.validateUser(user);
    this.validateFeature(feature);
    this.validateResource(resource);

    if (feature === Feature.READ_USER) {
      return {
        id: resource.id,
        username: resource.username,
        features: resource.features,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }

    if (feature === Feature.READ_USER_SELF) {
      if (user.id === resource.id) {
        return {
          id: resource.id,
          username: resource.username,
          email: resource.email,
          features: resource.features,
          created_at: resource.created_at,
          updated_at: resource.updated_at,
        };
      }
    }

    if (feature === Feature.READ_SESSION) {
      if (user.id === resource.user_id) {
        return {
          id: resource.id,
          token: resource.token,
          user_id: resource.user_id,
          expires_at: resource.expires_at,
          created_at: resource.created_at,
          updated_at: resource.updated_at,
        };
      }
    }

    if (feature === Feature.READ_ACTIVATION_TOKEN) {
      return {
        id: resource.id,
        user_id: resource.user_id,
        used_at: resource.used_at,
        created_at: resource.created_at,
        expires_at: resource.expires_at,
        updated_at: resource.updated_at,
      };
    }

    if (feature === Feature.READ_MIGRATION) {
      return resource.map((migration) => {
        return {
          path: migration.path,
          name: migration.name,
          timestamp: migration.timestamp,
        };
      });
    }

    if (feature === Feature.READ_STATUS) {
      return {
        updated_at: resource.updated_at,
        dependencies: {
          database: {
            ...(this.can(user, Feature.READ_STATUS_ALL) ? { version: resource.dependencies.database.version } : {}),
            max_connections: resource.dependencies.database.max_connections,
            opened_connections: resource.dependencies.database.opened_connections,
          },
        },
      };
    }
  }

  private static validateUser(user) {
    if (!user || !user.features) {
      throw new InternalServerError({
        cause: "é necessario fornecer `user` no model `authorization`",
      });
    }
  }

  private static validateFeature(feature) {
    if (!feature || !Object.values(Feature).includes(feature)) {
      throw new InternalServerError({
        cause: "é necessario informa uma feature conhecida",
      });
    }
  }

  private static validateResource(resource) {
    if (!resource) {
      throw new InternalServerError({
        cause: "é necessario informa um resouce",
      });
    }
  }
}
