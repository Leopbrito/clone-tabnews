import nodemailer from "nodemailer";
import { ServiceError } from "./errors";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

export class Email {
  static async send(mailOptions) {
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new ServiceError({
        message: "Não foi possivel enviar o email.",
        action: "Verifique se o serviço de email está disponivel.",
        cause: error,
        context: mailOptions,
      });
    }
  }
}
