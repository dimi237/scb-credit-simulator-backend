import App from "./app";
const PORT = process.env['PORT'] ? parseInt(process.env['PORT']) : 3000;
const app = new App();
app.start(PORT);

