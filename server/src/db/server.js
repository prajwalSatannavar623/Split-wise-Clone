import mongoose from "mongoose";
import { DB_URL } from "../constant.js";

async function connectToMongoDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONOGO_DB_URL}/${DB_URL}`,
    );

    console.log(
      `Connected to MongoDB, DB CONFIG: ${(await connectionInstance).connection.host}`,
    );
  } catch (error) {
    console.log("DATABASE CONNECTION ERROR", error);
    process.exit(1);
  }
}

export { connectToMongoDB };
