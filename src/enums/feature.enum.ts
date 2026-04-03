export enum Feature {
  // SESSION
  CREATE_SESSION = "create:session",
  READ_SESSION = "read:session",

  // ACTIVATION TOKEN
  READ_ACTIVATION_TOKEN = "read:activation_token",

  // USER
  CREATE_USER = "create:user",
  READ_USER = "read:user",
  READ_USER_SELF = "read:user:self",
  UPDATE_USER = "update:user",
  UPDATE_USER_OTHERS = "update:user:others",

  // MIGRATIONS
  CREATE_MIGRATION = "create:migration",
  READ_MIGRATION = "read:migration",

  // STATUS
  READ_STATUS = "read:status",
  READ_STATUS_ALL = "read:status:all",
}
