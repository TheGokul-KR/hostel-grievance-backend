const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

// Prevent strictQuery warning
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err.message);
    setTimeout(connectDB, 5000); // retry instead of killing server
  }
};

connectDB();

// Connection event safety
mongoose.connection.on("disconnected", () => {
  console.error("MongoDB disconnected. Retrying...");
  connectDB();
});

mongoose.connection.on("error", err => {
  console.error("MongoDB error:", err.message);
});
