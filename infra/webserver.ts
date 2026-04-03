export class WebServer {
  static get origin() {
    if (["test", "development"].includes(process.env.NODE_ENV)) {
      return "http://localhost:3000";
    }
    return "https://tabnews.leopbrito.com.br";
  }
}
