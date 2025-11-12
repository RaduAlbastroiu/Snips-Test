import dotenv from "dotenv";
import { configApp } from "./app";

dotenv.config();

const app = configApp();

const portValue = process.env.PORT ?? "3000";
const port = Number(portValue);

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
