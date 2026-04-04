import bcryptjs from "bcryptjs";

export class Password {
  static async hash(password: string) {
    const rounds = process.env.NODE_ENV === "production" ? 14 : 1;
    return await bcryptjs.hash(password, rounds);
  }

  static async compare(providedPassword: string, storedPassword: string) {
    return await bcryptjs.compare(providedPassword, storedPassword);
  }
}
