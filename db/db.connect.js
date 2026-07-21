const mongoose = require("mongoose");

require("dotenv").config();

const mongoUri = process.env.MONGODB;

const initializeDatabase = async () => {
  return mongoose
    .connect(mongoUri)
    .then(() => console.log("Connected to database"))
    .catch((error) => {
      console.log("Error while connecting to the database", error);
      throw error;
    });
};

module.exports = { initializeDatabase };