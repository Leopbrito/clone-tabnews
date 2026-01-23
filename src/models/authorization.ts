import { Feature } from "src/enums/feature.enum";

export class Authorization {
  static can(user, feature, resource?) {
    let authorized = false;

    if (user.features.includes(feature)) {
      authorized = true;
    }

    if (feature === Feature.UPDATE_USER && resource) {
      authorized = false;

      if (
        user.id === resource.id ||
        this.can(user, Feature.UPDATE_USER_OTHERS)
      ) {
        authorized = true;
      }
    }

    return authorized;
  }
}
