export enum Feature {
  // CREATE
  CREATE_SESSION = "create:session",
  CREATE_USER = "create:user",

  // READ
  READ_ACTIVATION_TOTEN = "read:activation_token",
  READ_SESSION = "read:session",
  READ_USER = "read:user",

  // UPDATE
  UPDATE_USER = "update:user",
  UPDATE_USER_OTHERS = "update:user:others",
}
