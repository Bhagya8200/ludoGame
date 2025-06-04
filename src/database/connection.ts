import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ludo-game";

let isConnected = false;

export const connectToDatabase = async (): Promise<void> => {
  if (isConnected) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log("Connected to MongoDB");

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      isConnected = false;
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};
