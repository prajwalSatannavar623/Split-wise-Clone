import app from "./app.js";
import mongoose from "mongoose";
import { connectToMongoDB } from "./db/server.js";

connectToMongoDB()
  .then(() => {
    const server = app.listen(process.env.PORT, () => {
      console.log(`Server listening on port: ${process.env.PORT}`);
    });

    server.on("error", (error) => {
      console.log("APP ERROR :: EXPRESS ERROR", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.log("ERROR CONNECTING TO DATABASE");
    process.exit(1);
  });
