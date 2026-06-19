import app from "./app.js";
import mongoose from "mongoose";
import { connectToMongoDB } from "./db/server.js";

connectToMongoDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("APP ERROR :: EXPRESS ERROR", error);
      process.exit(1);
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("ERROR CONNECTING TO DATABASE");
  });
