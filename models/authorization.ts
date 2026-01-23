import { Feature } from "enums/feature.enum";

export class Authorization {
  static can(user, feature, resource?) {
    let authorized = false;

    if (user.features.includes(feature)) {
      authorized = true;
    }

    if (feature === Feature.UPDATE_USER && resource) {
      authorized = false;

      if (user.id === resource.id) {
        authorized = true;
      }
    }

    return authorized;
  }
}
