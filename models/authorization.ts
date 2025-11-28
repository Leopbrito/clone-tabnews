export class Authorization {
  static can(user, feature) {
    return user.features.includes(feature);
  }
}
