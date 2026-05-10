import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = process.env.NODE_ENV || "development";

import { createApp } from "./src/server/app.js";

async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
